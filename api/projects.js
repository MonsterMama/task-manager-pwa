const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PROJECTS_DB_ID = process.env.NOTION_PROJECTS_DB_ID;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  
  try {
    const response = await notion.databases.query({ database_id: PROJECTS_DB_ID });
    const projects = response.results.map(page => ({
      id: page.id,
      title: page.properties.Title?.title?.[0]?.text?.content || 'Untitled',
    }));
    return res.json({ projects });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
