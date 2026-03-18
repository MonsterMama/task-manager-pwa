const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  if (req.method === 'PATCH') {
    try {
      const { name, status, priority, dueDate, order, notes } = req.body;
      const properties = {};
      if (name !== undefined) properties.Name = { title: [{ text: { content: name } }] };
      if (status !== undefined) properties.Status = { status: { name: status } };
      if (priority !== undefined) properties.Priority = { select: { name: priority } };
      if (dueDate !== undefined) properties['Due Date'] = dueDate ? { date: { start: dueDate } } : { date: null };
      if (order !== undefined) properties.Order = { number: order };
      if (notes !== undefined) properties.Notes = { rich_text: notes ? [{ text: { content: notes } }] : [] };

      await notion.pages.update({ page_id: id, properties });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await notion.pages.update({ page_id: id, archived: true });
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
