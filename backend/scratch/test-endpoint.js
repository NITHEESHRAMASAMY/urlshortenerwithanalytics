async function main() {
  try {
    const res = await fetch('http://localhost:5000/api/urls/public/sUSvP8/analytics');
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('--- Public API Response ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error fetching public API:', err.message);
  }
}

main();
