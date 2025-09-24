// Test the model generation API
const testModelAPI = async () => {
  try {
    const response = await fetch('https://closet.city/api/model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userImageUrl: 'https://closet.city/api/r2/model/17b595ac-b65b-4ea6-8eac-bf02cb66a0df.webp',
        async: true
      })
    });
    
    const result = await response.json();
    console.log('Model API Response:', result);
    console.log('Status:', response.status);
  } catch (error) {
    console.error('Error:', error);
  }
};

testModelAPI();
