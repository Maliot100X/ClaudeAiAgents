import axios from 'axios';

const PINATA_API_URL = 'https://api.pinata.cloud';
const JWT = process.env.PINATA_JWT || '';

const api = axios.create({
  baseURL: PINATA_API_URL,
  headers: {
    'Authorization': `Bearer ${JWT}`,
  },
});

// Upload file to IPFS
export async function uploadFileToIPFS(file: File | Blob, name?: string): Promise<{ success: boolean; url?: string; hash?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file, name || 'file');
    
    const metadata = JSON.stringify({
      name: name || 'Claude AI Agents Upload',
    });
    formData.append('pinataMetadata', metadata);
    
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);
    
    const response = await api.post('/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const hash = response.data.IpfsHash;
    return {
      success: true,
      hash,
      url: `https://gateway.pinata.cloud/ipfs/${hash}`,
    };
  } catch (error: any) {
    console.error('Error uploading to IPFS:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to upload to IPFS',
    };
  }
}

// Upload JSON to IPFS
export async function uploadJSONToIPFS(data: any, name?: string): Promise<{ success: boolean; url?: string; hash?: string; error?: string }> {
  try {
    const metadata = {
      pinataContent: data,
      pinataMetadata: {
        name: name || 'Claude AI Agents Metadata',
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };
    
    const response = await api.post('/pinning/pinJSONToIPFS', metadata);
    
    const hash = response.data.IpfsHash;
    return {
      success: true,
      hash,
      url: `https://gateway.pinata.cloud/ipfs/${hash}`,
    };
  } catch (error: any) {
    console.error('Error uploading JSON to IPFS:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to upload JSON to IPFS',
    };
  }
}

// Get file from IPFS
export function getIPFSUrl(hash: string): string {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

// Unpin file from IPFS
export async function unpinFromIPFS(hash: string): Promise<boolean> {
  try {
    await api.delete(`/pinning/unpin/${hash}`);
    return true;
  } catch (error) {
    console.error('Error unpinning from IPFS:', error);
    return false;
  }
}

export { api };
