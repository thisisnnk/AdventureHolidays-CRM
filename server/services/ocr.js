const Tesseract = require('tesseract.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Process image OCR to extract name and phone number
 * @param {string} imageUrl - URL of the image to process
 * @returns {Promise<{success: boolean, name: string|null, phone: string|null, destination: string|null}>}
 */
const processImageOCR = async (imageUrl) => {
    try {
        // Download image
        const response = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'arraybuffer'
        });
        
        // Save temporarily
        const tempPath = path.join('/tmp', `ocr_${Date.now()}.jpg`);
        fs.writeFileSync(tempPath, response.data);
        
        // Perform OCR
        const result = await Tesseract.recognize(tempPath, 'eng', {
            logger: m => console.log(m)
        });
        
        // Clean up temp file
        fs.unlinkSync(tempPath);
        
        const text = result.data.text;
        console.log('OCR Text:', text);
        
        // Extract information
        const extractedData = extractInformation(text);
        
        return {
            success: true,
            ...extractedData
        };
    } catch (error) {
        console.error('OCR processing error:', error);
        return {
            success: false,
            name: null,
            phone: null,
            destination: null,
            error: error.message
        };
    }
};

/**
 * Extract name, phone, and destination from OCR text
 * @param {string} text - OCR extracted text
 * @returns {{name: string|null, phone: string|null, destination: string|null}}
 */
const extractInformation = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let name = null;
    let phone = null;
    let destination = null;
    
    // Phone number patterns
    const phonePatterns = [
        /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,  // International formats
        /\d{10}/,  // 10 digit numbers
        /\d{5}\s?\d{5}/,  // Indian format
        /\+91\s?\d{10}/,  // Indian with +91
    ];
    
    // Extract phone number
    for (const line of lines) {
        for (const pattern of phonePatterns) {
            const match = line.match(pattern);
            if (match) {
                phone = match[0].replace(/\s/g, '');
                break;
            }
        }
        if (phone) break;
    }
    
    // Extract name (usually the first line or a line with capitalized words)
    for (const line of lines) {
        // Skip lines that look like phone numbers, emails, or addresses
        if (/\d{5,}/.test(line)) continue;
        if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(line)) continue;
        if (/^(street|road|avenue|lane|city|state|pin|zip)/i.test(line)) continue;
        
        // Look for lines with 2-4 capitalized words (likely a name)
        const words = line.split(/\s+/);
        const capitalizedWords = words.filter(word => /^[A-Z][a-z]+$/.test(word));
        
        if (capitalizedWords.length >= 2 && capitalizedWords.length <= 4) {
            name = line;
            break;
        }
    }
    
    // If no name found, use the first non-phone, non-email line
    if (!name) {
        for (const line of lines) {
            if (!/\d{5,}/.test(line) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(line)) {
                name = line;
                break;
            }
        }
    }
    
    // Try to extract destination (look for travel-related keywords)
    const travelKeywords = ['destination', 'travel to', 'going to', 'visit', 'trip to', 'tour'];
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        for (const keyword of travelKeywords) {
            if (lowerLine.includes(keyword)) {
                destination = line.replace(new RegExp(keyword, 'gi'), '').trim();
                break;
            }
        }
        if (destination) break;
    }
    
    return {
        name: name?.substring(0, 100) || null,
        phone: phone || null,
        destination: destination?.substring(0, 200) || null
    };
};

module.exports = {
    processImageOCR,
    extractInformation
};
