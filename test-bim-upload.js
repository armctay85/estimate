const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testBIMUpload() {
  console.log('Testing BIM upload functionality...\n');

  // Create a test file (simulating a small DWG file)
  const testFileName = 'test-drawing.dwg';
  const testFileContent = Buffer.from('Test DWG file content for upload testing');
  
  // Create form data
  const form = new FormData();
  form.append('bimFile', testFileContent, {
    filename: testFileName,
    contentType: 'application/acad'
  });

  try {
    console.log('1. Uploading test BIM file...');
    const response = await axios.post('http://localhost:5000/api/forge/upload-bim', form, {
      headers: {
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log('2. Upload response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.urn) {
      console.log('3. Upload successful! URN:', response.data.urn);
      
      // Test translation status endpoint
      console.log('\n4. Checking translation status...');
      const statusResponse = await axios.get(
        `http://localhost:5000/api/forge/translation-status?urn=${encodeURIComponent(response.data.urn)}`
      );
      console.log('5. Translation status:', JSON.stringify(statusResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('Upload test failed:', error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error('Server error details:', error.response.data);
    }
  }
}

// Run the test
testBIMUpload();