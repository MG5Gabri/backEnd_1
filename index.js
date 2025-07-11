const express = require('express');
const cors = require('cors');
require('dotenv').config();
const partidaRoutes = require('./routes/partida');
const jugadorRoutes = require('./routes/jugador');
const nivelRoutes = require('./routes/nivel');


const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/partida', partidaRoutes);
app.use('/jugador', jugadorRoutes);
app.use('/nivel', nivelRoutes)





app.use('/api/auth', require('./routes/auth'));
app.use('/api/jugador', require('./routes/jugador'));
app.use('/api/nivel', require('./routes/nivel'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎮 Servidor corriendo en el puerto ${PORT}`));


app.get('/api/partida/:pin', async (req, res) => {
    const { pin } = req.params;
    const [partida] = await db.query('SELECT cantidad_niveles FROM partida WHERE pin = ?', [pin]);
  
    if (partida.length === 0) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }
  
    res.json(partida[0]);
  });