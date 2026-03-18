const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const TASKS_DB_ID = process.env.NOTION_TASKS_DB_ID;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const { projectId } = req.query;
      const queryParams = {
        database_id: TASKS_DB_ID,
        sorts: [
          { property: 'Order', direction: 'ascending' },
          { timestamp: 'created_time', direction: 'ascending' }
        ]
      };
      if (projectId) {
        queryParams.filter = {
          property: 'Project',
          relation: { contains: projectId }
        };
      }
      const response = await notion.databases.query(queryParams);
      const tasks = response.results.map(page => ({
        id: page.id,
        name: page.properties.Name?.title?.[0]?.text?.content || 'Untitled',
        status: page.properties.Status?.status?.name || 'To Do',
        priority: page.properties.Priority?.select?.name || 'Medium',
        dueDate: page.properties['Due Date']?.date?.start || null,
        order: page.properties.Order?.number ?? 999,
        notes: page.properties.Notes?.rich_text?.[0]?.text?.content || '',
        project: page.properties.Project?.relation?.[0]?.id || null,
      }));
      return res.json({ tasks });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, status, priority, dueDate, order, notes, projectId } = req.body;
      const page = await notion.pages.create({
        parent: { database_id: TASKS_DB_ID },
        properties: {
          Name: { title: [{ text: { content: name || 'New Task' } }] },
          Status: { status: { name: status || 'To Do' } },
          Priority: { select: { name: priority || 'Medium' } },
          ...(dueDate && { 'Due Date': { date: { start: dueDate } } }),
          ...(order !== undefined && { Order: { number: order } }),
          ...(notes && { Notes: { rich_text: [{ text: { content: notes } }] } }),
          ...(projectId && { Project: { relation: [{ id: projectId }] } }),
        }
      });
      return res.json({ id: page.id });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
