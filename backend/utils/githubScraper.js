const axios = require('axios');

async function scrapeGitHubRepo(repoUrl) {
  try {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub URL');
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace('.git', '');

    const repoResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${cleanRepo}`,
      { headers: { 'Accept': 'application/vnd.github.v3+json' } }
    );

    const data = repoResponse.data;

    return {
      name: data.name,
      description: data.description || 'No description provided',
      author: data.owner.login,
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      topics: data.topics.join(', '),
      created_at: data.created_at
    };
  } catch (error) {
    console.error('GitHub scraping error:', error.message);
    throw new Error('Failed to fetch repository data');
  }
}

module.exports = { scrapeGitHubRepo };