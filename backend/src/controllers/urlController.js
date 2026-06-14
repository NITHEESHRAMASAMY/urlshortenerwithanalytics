const useragent = require('express-useragent');
const requestIp = require('request-ip');
const geoip = require('geoip-lite');
const prisma = require('../config/db');

// Helper: Log activities
const logActivity = async (userId, action, details) => {
  try {
    if (!userId) return;
    await prisma.activity.create({
      data: {
        userId,
        action,
        details
      }
    });
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

// Helper: Generate random short code
const generateShortCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper: Validate URL syntax
const isValidUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

// Helper: Aggregate click trends for Recharts
const aggregateTrends = (analyticsRecords) => {
  const daily = {};
  const weekly = {};
  const monthly = {};

  // Pre-populate last 7 days for daily click trends to ensure a nice chart display
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    daily[dateStr] = 0;
  }

  // Pre-populate last 4 weeks for weekly trends
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - (i * 7));
    // Calculate week number
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
    const weekKey = `Wk ${weekNum}`;
    weekly[weekKey] = 0;
  }

  // Pre-populate last 3 months for monthly trends
  for (let i = 2; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = d.toLocaleDateString('en-US', { month: 'short' });
    monthly[monthKey] = 0;
  }

  analyticsRecords.forEach(visit => {
    const date = new Date(visit.timestamp);
    
    // Daily Format: "Jun 12"
    const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (daily[dayKey] !== undefined) {
      daily[dayKey]++;
    }

    // Weekly Format: "Wk [number]"
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
    const weekKey = `Wk ${weekNum}`;
    if (weekly[weekKey] !== undefined) {
      weekly[weekKey]++;
    } else {
      // fallback in case it's older than 4 weeks
      weekly[weekKey] = 1;
    }

    // Monthly Format: "Jun"
    const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
    if (monthly[monthKey] !== undefined) {
      monthly[monthKey]++;
    } else {
      monthly[monthKey] = 1;
    }
  });

  const dailyData = Object.keys(daily).map(key => ({ name: key, clicks: daily[key] }));
  const weeklyData = Object.keys(weekly).map(key => ({ name: key, clicks: weekly[key] }));
  const monthlyData = Object.keys(monthly).map(key => ({ name: key, clicks: monthly[key] }));

  return { daily: dailyData, weekly: weeklyData, monthly: monthlyData };
};

// @desc    Shorten a long URL
// @route   POST /api/urls/shorten
// @access  Public (Optional auth)
const shortenUrl = async (req, res) => {
  const { originalUrl, alias, expiryDate, analyticsPassword } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!originalUrl) {
    return res.status(400).json({ message: 'Original URL is required' });
  }

  if (!isValidUrl(originalUrl)) {
    return res.status(400).json({ message: 'Invalid URL. Make sure it starts with http:// or https://' });
  }

  let parsedExpiry = null;
  if (expiryDate) {
    parsedExpiry = new Date(expiryDate);
    if (isNaN(parsedExpiry.getTime())) {
      return res.status(400).json({ message: 'Invalid expiry date format' });
    }
    if (parsedExpiry < new Date()) {
      return res.status(400).json({ message: 'Expiry date must be in the future' });
    }
  }

  try {
    let finalShortCode = '';

    if (alias) {
      const cleanAlias = alias.trim().replace(/[^a-zA-Z0-9-_]/g, '');
      if (cleanAlias.length < 3) {
        return res.status(400).json({ message: 'Custom alias must be at least 3 alphanumeric characters' });
      }

      const existing = await prisma.shortUrl.findFirst({
        where: {
          OR: [
            { shortCode: cleanAlias },
            { alias: cleanAlias }
          ]
        }
      });

      if (existing) {
        return res.status(400).json({ message: 'Custom alias is already in use' });
      }

      finalShortCode = cleanAlias;
    } else {
      let isUnique = false;
      while (!isUnique) {
        const potentialCode = generateShortCode();
        const existing = await prisma.shortUrl.findFirst({
          where: {
            OR: [
              { shortCode: potentialCode },
              { alias: potentialCode }
            ]
          }
        });
        if (!existing) {
          finalShortCode = potentialCode;
          isUnique = true;
        }
      }
    }

    const shortUrl = await prisma.shortUrl.create({
      data: {
        originalUrl,
        shortCode: finalShortCode,
        alias: alias ? finalShortCode : null,
        expiryDate: parsedExpiry,
        analyticsPassword: analyticsPassword ? analyticsPassword.trim() : null,
        userId
      }
    });

    if (userId) {
      await logActivity(userId, 'CREATED', `Created short URL /${finalShortCode} targeting ${originalUrl}`);
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    res.status(201).json({
      id: shortUrl.id,
      originalUrl: shortUrl.originalUrl,
      shortCode: shortUrl.shortCode,
      shortUrl: `${baseUrl}/${shortUrl.shortCode}`,
      alias: shortUrl.alias,
      expiryDate: shortUrl.expiryDate,
      analyticsPassword: shortUrl.analyticsPassword,
      clicks: shortUrl.clicks,
      createdAt: shortUrl.createdAt
    });

  } catch (error) {
    console.error('URL shortening error:', error);
    res.status(500).json({ message: 'Server error while generating short URL' });
  }
};

// @desc    Get all URLs for logged-in user (with filters, search, sorting, pagination)
// @route   GET /api/urls
// @access  Private
const getUserUrls = async (req, res) => {
  try {
    const { search = '', status = 'all', sortBy = 'createdAt', order = 'desc', page = 1, limit = 10, workspaceId, favorite } = req.query;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    // Define base query conditions
    const whereConditions = {
      userId: req.user.id,
      OR: [
        { originalUrl: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
        { alias: { contains: search, mode: 'insensitive' } }
      ]
    };

    if (workspaceId) {
      if (workspaceId === 'none') {
        whereConditions.workspaceId = null;
      } else {
        whereConditions.workspaceId = workspaceId;
      }
    }

    if (favorite === 'true') {
      whereConditions.isFavorite = true;
    }

    // Apply Active / Expired link filters
    const now = new Date();
    if (status === 'active') {
      whereConditions.OR = whereConditions.OR.map(condition => ({
        ...condition,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: now } }
        ]
      }));
    } else if (status === 'expired') {
      whereConditions.AND = [
        { expiryDate: { not: null } },
        { expiryDate: { lt: now } }
      ];
    }

    // Retrieve count for pagination
    const totalCount = await prisma.shortUrl.count({ where: whereConditions });

    // Fetch matching links
    const urls = await prisma.shortUrl.findMany({
      where: whereConditions,
      orderBy: { [sortBy]: order },
      skip,
      take: parsedLimit,
      include: {
        notes: {
          orderBy: { createdAt: 'desc' }
        },
        workspace: true
      }
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const formattedUrls = urls.map(url => ({
      ...url,
      shortUrl: `${baseUrl}/${url.shortCode}`
    }));

    res.json({
      urls: formattedUrls,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit
      }
    });

  } catch (error) {
    console.error('Fetch user URLs error:', error);
    res.status(500).json({ message: 'Server error while retrieving URLs' });
  }
};

// @desc    Get dashboard stats (Total, Clicks, Active, Expired, Average Daily Visits)
// @route   GET /api/urls/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const now = new Date();

    const urls = await prisma.shortUrl.findMany({
      where: { userId: req.user.id },
      select: { 
        clicks: true, 
        expiryDate: true,
        createdAt: true
      }
    });

    const totalLinks = urls.length;
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);

    // Filter Active and Expired links
    const activeLinks = urls.filter(url => !url.expiryDate || new Date(url.expiryDate) > now).length;
    const expiredLinks = totalLinks - activeLinks;

    // Calculate Average Daily Visits since the user's oldest link creation
    let averageDailyVisits = 0;
    if (totalLinks > 0) {
      const oldestDate = urls.reduce((oldest, url) => {
        return url.createdAt < oldest ? url.createdAt : oldest;
      }, new Date());

      const daysDiff = Math.ceil((new Date() - oldestDate) / (1000 * 60 * 60 * 24));
      averageDailyVisits = parseFloat((totalClicks / Math.max(1, daysDiff)).toFixed(2));
    }

    res.json({
      totalLinks,
      totalClicks,
      activeLinks,
      expiredLinks,
      averageDailyVisits
    });
  } catch (error) {
    console.error('Fetch user stats error:', error);
    res.status(500).json({ message: 'Server error while retrieving dashboard stats' });
  }
};

// @desc    Get leaderboard rankings (Most Clicked, Fastest Growing)
// @route   GET /api/urls/leaderboard
// @access  Private
const getUserLeaderboard = async (req, res) => {
  try {
    const urls = await prisma.shortUrl.findMany({
      where: { userId: req.user.id },
      orderBy: { clicks: 'desc' },
      take: 20 // Fetch top 20 to compute speeds
    });

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    // 1. Most Clicked (Top 5)
    const mostClicked = urls.slice(0, 5).map(url => ({
      ...url,
      shortUrl: `${baseUrl}/${url.shortCode}`
    }));

    // 2. Fastest Growing (Clicks / Days Active) (Top 5)
    const fastestGrowing = urls
      .map(url => {
        const days = Math.ceil((new Date() - new Date(url.createdAt)) / (1000 * 60 * 60 * 24));
        const speed = parseFloat((url.clicks / Math.max(1, days)).toFixed(2));
        return {
          ...url,
          shortUrl: `${baseUrl}/${url.shortCode}`,
          growthSpeed: speed
        };
      })
      .sort((a, b) => b.growthSpeed - a.growthSpeed)
      .slice(0, 5);

    res.json({
      mostClicked,
      fastestGrowing
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ message: 'Server error while generating leaderboard' });
  }
};

// @desc    Delete a short URL
// @route   DELETE /api/urls/:id
// @access  Private
const deleteUrl = async (req, res) => {
  const { id } = req.params;

  try {
    const url = await prisma.shortUrl.findUnique({
      where: { id }
    });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this URL' });
    }

    await prisma.shortUrl.delete({
      where: { id }
    });

    await logActivity(req.user.id, 'DELETED', `Deleted short URL /${url.shortCode} targeting ${url.originalUrl}`);

    res.json({ message: 'URL successfully deleted' });
  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({ message: 'Server error while deleting URL' });
  }
};

// @desc    Get URL analytics (Private dashboard view)
// @route   GET /api/urls/:id/analytics
// @access  Private
const getUrlAnalytics = async (req, res) => {
  const { id } = req.params;

  try {
    const url = await prisma.shortUrl.findUnique({
      where: { id },
      include: {
        analytics: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to view analytics for this URL' });
    }

    const lastVisit = url.analytics.length > 0 ? url.analytics[0].timestamp : null;
    const trends = aggregateTrends(url.analytics);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    res.json({
      urlInfo: {
        id: url.id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: `${baseUrl}/${url.shortCode}`,
        clicks: url.clicks,
        createdAt: url.createdAt,
        expiryDate: url.expiryDate,
        analyticsPassword: url.analyticsPassword
      },
      analytics: {
        totalClicks: url.clicks,
        lastVisit,
        trends,
        recentVisits: url.analytics.slice(0, 100) // return last 100 for details list
      }
    });

  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching analytics' });
  }
};

// @desc    Get public URL analytics (unauthenticated)
// @route   GET /api/urls/public/:shortCode/analytics
// @access  Public
const getPublicUrlAnalytics = async (req, res) => {
  const { shortCode } = req.params;

  try {
    const url = await prisma.shortUrl.findFirst({
      where: {
        OR: [
          { shortCode },
          { alias: shortCode }
        ]
      },
      include: {
        analytics: {
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!url) {
      return res.status(404).json({ message: 'NexLink not found' });
    }

    if (url.analyticsPassword) {
      const providedPassword = req.query.password || req.headers['x-analytics-password'];
      if (!providedPassword || providedPassword !== url.analyticsPassword) {
        return res.status(401).json({ 
          message: 'Password required to view public analytics', 
          isPasswordProtected: true 
        });
      }
    }

    const lastVisit = url.analytics.length > 0 ? url.analytics[0].timestamp : null;
    const trends = aggregateTrends(url.analytics);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    res.json({
      urlInfo: {
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        shortUrl: `${baseUrl}/${url.shortCode}`,
        clicks: url.clicks,
        createdAt: url.createdAt,
        expiryDate: url.expiryDate
      },
      analytics: {
        totalClicks: url.clicks,
        lastVisit,
        trends,
        recentVisits: url.analytics.slice(0, 30) // return only last 30 for public logs
      }
    });

  } catch (error) {
    console.error('Fetch public analytics error:', error);
    res.status(500).json({ message: 'Server error fetching public stats' });
  }
};

// @desc    Redirect short code to original URL (with advanced tracking & Socket.IO triggers)
// @route   GET /:shortCode
// @access  Public
const redirectUrl = async (req, res) => {
  const { shortCode } = req.params;

  try {
    const url = await prisma.shortUrl.findFirst({
      where: {
        OR: [
          { shortCode },
          { alias: shortCode }
        ]
      }
    });

    if (!url) {
      return res.status(404).send(`
        <html>
          <head>
            <title>Link Not Found - NexLink</title>
            <style>
              body { background-color: #0A0A0A; color: #fff; font-family: sans-serif; text-align: center; padding: 100px 20px; }
              h1 { color: #FBBF24; font-size: 32px; }
              p { color: #888; margin-bottom: 20px; }
              a { color: #10B981; text-decoration: none; border: 1px solid #10B981; padding: 10px 20px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>404 - NexLink Not Found</h1>
            <p>The link you are trying to reach does not exist or has been removed.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Go to NexLink Home</a>
          </body>
        </html>
      `);
    }

    if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
      return res.status(410).send(`
        <html>
          <head>
            <title>Link Expired - NexLink</title>
            <style>
              body { background-color: #0A0A0A; color: #fff; font-family: sans-serif; text-align: center; padding: 100px 20px; }
              h1 { color: #EF4444; font-size: 32px; }
              p { color: #888; margin-bottom: 20px; }
              a { color: #10B981; text-decoration: none; border: 1px solid #10B981; padding: 10px 20px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>Link Expired</h1>
            <p>This NexLink has reached its expiration date and is no longer active.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">Go to NexLink Home</a>
          </body>
        </html>
      `);
    }

    // Update click count
    const updatedUrl = await prisma.shortUrl.update({
      where: { id: url.id },
      data: { clicks: { increment: 1 } }
    });

    // 1. Basic User Agent Extraction
    const uaSource = req.headers['user-agent'] || '';
    const ua = useragent.parse(uaSource);
    
    const browser = ua.browser || 'Unknown';
    const os = ua.os || 'Unknown';
    let device = 'Desktop';
    if (ua.isMobile) device = 'Mobile';
    else if (ua.isTablet) device = 'Tablet';
    else if (ua.isBot) device = 'Crawler';

    // 2. IP Lookup
    const clientIp = requestIp.getClientIp(req) || req.ip || '127.0.0.1';

    // 3. Country & City GeoIP Resolution (with Local simulation backup)
    let country = 'Unknown';
    let city = 'Unknown';
    let timezone = 'UTC';

    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
      // simulate localized developer clicks
      country = 'IN';
      city = 'Bengaluru';
      timezone = 'Asia/Kolkata';
    } else {
      const geo = geoip.lookup(clientIp);
      if (geo) {
        country = geo.country || 'Unknown';
        city = geo.city || 'Unknown';
        timezone = geo.timezone || 'UTC';
      }
    }

    // 4. Referrer header parse
    const rawReferrer = req.headers.referer || req.headers.referrer || 'Direct';
    let referrer = 'Direct';
    try {
      if (rawReferrer !== 'Direct') {
        const refUrl = new URL(rawReferrer);
        referrer = refUrl.hostname || 'Direct';
      }
    } catch (e) {
      referrer = 'Direct';
    }

    // 5. Language code extraction
    const acceptLanguage = req.headers['accept-language'] || 'en';
    const language = acceptLanguage.split(',')[0].split(';')[0];

    // Write visitor analytics
    const newVisit = await prisma.analytics.create({
      data: {
        shortUrlId: url.id,
        browser,
        device,
        os,
        country,
        city,
        referrer,
        timezone,
        language,
        ip: clientIp
      }
    });

    // 6. Broadcast Real-time Event on Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('url-click', {
        shortUrlId: url.id,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        totalClicks: updatedUrl.clicks,
        userId: url.userId, // keep track of which user owns this URL
        visit: {
          id: newVisit.id,
          timestamp: newVisit.timestamp,
          browser: newVisit.browser,
          device: newVisit.device,
          os: newVisit.os,
          country: newVisit.country,
          city: newVisit.city,
          referrer: newVisit.referrer,
          timezone: newVisit.timezone,
          language: newVisit.language,
          ip: newVisit.ip
        }
      });
    }

    // Log click event
    if (url.userId) {
      await logActivity(
        url.userId,
        'CLICKED',
        `Visitor clicked /${url.shortCode} (${browser} on ${device} from ${city}, ${country})`
      );
    }

    // Perform redirect
    res.redirect(url.originalUrl);

  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const bulkShortenUrls = async (req, res) => {
  const { urls } = req.body; // array of { originalUrl, alias, expiryDate }
  const userId = req.user.id;

  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ message: 'An array of URLs is required' });
  }

  const results = [];
  const errors = [];

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of urls) {
        const { originalUrl, alias, expiryDate } = item;
        if (!originalUrl || !isValidUrl(originalUrl)) {
          errors.push({ originalUrl, message: 'Invalid URL syntax' });
          continue;
        }

        let parsedExpiry = null;
        if (expiryDate) {
          parsedExpiry = new Date(expiryDate);
          if (isNaN(parsedExpiry.getTime()) || parsedExpiry < new Date()) {
            parsedExpiry = null;
          }
        }

        let finalShortCode = '';
        if (alias) {
          const cleanAlias = alias.trim().replace(/[^a-zA-Z0-9-_]/g, '');
          if (cleanAlias.length < 3) {
            errors.push({ originalUrl, message: 'Alias must be at least 3 chars' });
            continue;
          }
          const existing = await tx.shortUrl.findFirst({
            where: {
              OR: [{ shortCode: cleanAlias }, { alias: cleanAlias }]
            }
          });
          if (existing) {
            errors.push({ originalUrl, message: `Alias "${cleanAlias}" is already in use` });
            continue;
          }
          finalShortCode = cleanAlias;
        } else {
          let isUnique = false;
          while (!isUnique) {
            const potentialCode = generateShortCode();
            const existing = await tx.shortUrl.findFirst({
              where: {
                OR: [{ shortCode: potentialCode }, { alias: potentialCode }]
              }
            });
            if (!existing) {
              finalShortCode = potentialCode;
              isUnique = true;
            }
          }
        }

        const newUrl = await tx.shortUrl.create({
          data: {
            originalUrl,
            shortCode: finalShortCode,
            alias: alias ? finalShortCode : null,
            expiryDate: parsedExpiry,
            userId
          }
        });

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        results.push({
          ...newUrl,
          shortUrl: `${baseUrl}/${newUrl.shortCode}`
        });
      }
    });

    if (results.length > 0) {
      await logActivity(userId, 'CREATED', `Bulk created ${results.length} shortened URLs`);
    }

    res.json({ results, errors });
  } catch (error) {
    console.error('Bulk shortening error:', error);
    res.status(500).json({ message: 'Server error during bulk shortening processing' });
  }
};

const toggleFavoriteUrl = async (req, res) => {
  const { id } = req.params;

  try {
    const url = await prisma.shortUrl.findUnique({ where: { id } });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updated = await prisma.shortUrl.update({
      where: { id },
      data: { isFavorite: !url.isFavorite }
    });

    await logActivity(
      req.user.id,
      'UPDATED',
      `Marked /${url.shortCode} as ${updated.isFavorite ? 'favorite' : 'non-favorite'}`
    );

    res.json(updated);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error toggling favorite' });
  }
};

const moveUrlWorkspace = async (req, res) => {
  const { id } = req.params;
  const { workspaceId } = req.body;

  try {
    const url = await prisma.shortUrl.findUnique({ where: { id } });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (workspaceId) {
      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace || workspace.userId !== req.user.id) {
        return res.status(400).json({ message: 'Invalid workspace folder' });
      }
    }

    const updated = await prisma.shortUrl.update({
      where: { id },
      data: { workspaceId }
    });

    let workspaceName = 'General';
    if (workspaceId) {
      const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      workspaceName = ws.name;
    }

    await logActivity(
      req.user.id,
      'UPDATED',
      `Moved /${url.shortCode} to workspace: ${workspaceName}`
    );

    res.json(updated);
  } catch (error) {
    console.error('Move workspace error:', error);
    res.status(500).json({ message: 'Server error moving workspace' });
  }
};

const addUrlNote = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Note content is required' });
  }

  try {
    const url = await prisma.shortUrl.findUnique({ where: { id } });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        shortUrlId: id
      }
    });

    await logActivity(req.user.id, 'UPDATED', `Added note to /${url.shortCode}`);

    res.status(201).json(note);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Server error adding note' });
  }
};

const editUrlNote = async (req, res) => {
  const { id, noteId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Note content is required' });
  }

  try {
    const url = await prisma.shortUrl.findUnique({ where: { id } });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.shortUrlId !== id) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { content: content.trim() }
    });

    await logActivity(req.user.id, 'UPDATED', `Edited note on /${url.shortCode}`);

    res.json(updatedNote);
  } catch (error) {
    console.error('Edit note error:', error);
    res.status(500).json({ message: 'Server error editing note' });
  }
};

const deleteUrlNote = async (req, res) => {
  const { id, noteId } = req.params;

  try {
    const url = await prisma.shortUrl.findUnique({ where: { id } });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.userId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const note = await prisma.note.findUnique({ where: { id: noteId } });
    if (!note || note.shortUrlId !== id) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await prisma.note.delete({ where: { id: noteId } });

    await logActivity(req.user.id, 'UPDATED', `Deleted note on /${url.shortCode}`);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error deleting note' });
  }
};

const updateUrlSettings = async (req, res) => {
  const { id } = req.params;
  const { alias, expiryDate, analyticsPassword } = req.body;
  const userId = req.user.id;

  try {
    const url = await prisma.shortUrl.findUnique({ where: { id } });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    if (url.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updateData = {};

    // Update custom alias/shortCode if provided
    if (alias !== undefined) {
      if (alias === null || alias.trim() === '') {
        // Keep standard generated shortCode
      } else {
        const cleanAlias = alias.trim().replace(/[^a-zA-Z0-9-_]/g, '');
        if (cleanAlias.length < 3) {
          return res.status(400).json({ message: 'Custom alias must be at least 3 chars' });
        }
        if (cleanAlias !== url.shortCode) {
          const existing = await prisma.shortUrl.findFirst({
            where: {
              OR: [{ shortCode: cleanAlias }, { alias: cleanAlias }]
            }
          });
          if (existing) {
            return res.status(400).json({ message: 'Alias is already in use' });
          }
          updateData.shortCode = cleanAlias;
          updateData.alias = cleanAlias;
        }
      }
    }

    // Update expiryDate if provided
    if (expiryDate !== undefined) {
      if (expiryDate === null || expiryDate === '') {
        updateData.expiryDate = null;
      } else {
        const parsedExpiry = new Date(expiryDate);
        if (isNaN(parsedExpiry.getTime())) {
          return res.status(400).json({ message: 'Invalid expiry date format' });
        }
        if (parsedExpiry < new Date()) {
          return res.status(400).json({ message: 'Expiry date must be in the future' });
        }
        updateData.expiryDate = parsedExpiry;
      }
    }

    // Update analyticsPassword if provided
    if (analyticsPassword !== undefined) {
      if (analyticsPassword === null || analyticsPassword.trim() === '') {
        updateData.analyticsPassword = null;
      } else {
        updateData.analyticsPassword = analyticsPassword.trim();
      }
    }

    const updatedUrl = await prisma.shortUrl.update({
      where: { id },
      data: updateData
    });

    await logActivity(userId, 'UPDATED', `Updated settings for short URL /${updatedUrl.shortCode}`);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    res.json({
      message: 'Link settings updated successfully',
      urlInfo: {
        id: updatedUrl.id,
        originalUrl: updatedUrl.originalUrl,
        shortCode: updatedUrl.shortCode,
        shortUrl: `${baseUrl}/${updatedUrl.shortCode}`,
        clicks: updatedUrl.clicks,
        createdAt: updatedUrl.createdAt,
        expiryDate: updatedUrl.expiryDate,
        analyticsPassword: updatedUrl.analyticsPassword
      }
    });

  } catch (error) {
    console.error('Update URL settings error:', error);
    res.status(500).json({ message: 'Server error updating link settings' });
  }
};

module.exports = {
  shortenUrl,
  getUserUrls,
  getUserStats,
  getUserLeaderboard,
  deleteUrl,
  getUrlAnalytics,
  getPublicUrlAnalytics,
  redirectUrl,
  bulkShortenUrls,
  toggleFavoriteUrl,
  moveUrlWorkspace,
  addUrlNote,
  editUrlNote,
  deleteUrlNote,
  updateUrlSettings
};
