import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4000;
const dataFile = path.resolve('data/entries.json');

app.use(express.json());
app.use(express.static('dist'));

app.get('/api/entries', (req, res) => {
  try {
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, '[]');
    }
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Unable to read entries file.' });
  }
});

app.post('/api/entries', (req, res) => {
  try {
    const entry = req.body;
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, '[]');
    }
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    data.push(entry);
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save entry.' });
  }
});

app.listen(PORT, () => {
  console.log(`Mood Tracker server running on http://localhost:${PORT}`);
});
