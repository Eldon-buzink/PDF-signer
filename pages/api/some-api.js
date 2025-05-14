import logger from '../../logger';  // Import the logger

export default function handler(req, res) {
  try {
    // Simulate an error
    throw new Error('API error occurred!');
  } catch (error) {
    // Log the error using Winston
    logger.error('API error: ' + error.message);
    // Respond with an error message
    res.status(500).json({ error: 'Something went wrong!' });
  }
}
