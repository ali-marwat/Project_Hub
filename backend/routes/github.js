const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

router.get('/repos/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ProjectHub-StudentShowcase'
        };

        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
            console.log(`[GitHub Proxy] Using token: Yes (${GITHUB_TOKEN.substring(0, 4)}...)`);
        } else {
            console.warn('[GitHub Proxy] No GITHUB_TOKEN found in environment!');
        }

        console.log(`[GitHub Proxy] Fetching repos for: ${username}`);
        let apiUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=15`;
        if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
            apiUrl += `&client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}`;
            console.log(`[GitHub Proxy] Using Client ID/Secret for standard auth: Yes`);
        }

        const response = await axios.get(apiUrl, {
            headers: headers
        });
        console.log(`[GitHub Proxy] Success: Found ${response.data.length} repos`);

        res.json(response.data);
    } catch (error) {
        console.error(`[GitHub Proxy] Error for ${username}:`, error.message);
        if (error.response) {
            console.error(`[GitHub Proxy] Status: ${error.response.status}`);
            console.error(`[GitHub Proxy] Data:`, JSON.stringify(error.response.data));
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            res.status(error.response.status).json({
                error: error.response.data.message || 'GitHub API Error'
            });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('[GitHub Proxy] No response received');
            res.status(500).json({ error: 'No response from GitHub' });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('[GitHub Proxy] Request setup error:', error.message);
            res.status(500).json({ error: 'Error setting up request' });
        }
    }
});

router.get('/readme/:owner/:repo', async (req, res) => {
    const { owner, repo } = req.params;

    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ProjectHub-StudentShowcase'
        };

        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        let apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
        if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
            apiUrl += `?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}`;
        }

        const response = await axios.get(apiUrl, {
            headers: headers
        });

        res.json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data.message || 'GitHub API Error'
            });
        } else {
            res.status(500).json({ error: 'Error fetching README' });
        }
    }
});

router.get('/languages/:owner/:repo', async (req, res) => {
    const { owner, repo } = req.params;

    try {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ProjectHub-StudentShowcase'
        };

        if (GITHUB_TOKEN) {
            headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        let apiUrl = `https://api.github.com/repos/${owner}/${repo}/languages`;
        if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
            apiUrl += `?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}`;
        }

        const response = await axios.get(apiUrl, { headers });
        res.json(response.data);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                error: error.response.data.message || 'GitHub API Error'
            });
        } else {
            res.status(500).json({ error: 'Error fetching languages' });
        }
    }
});

module.exports = router;
