const connection = require('../db/connection');


function generarCodigoJugador() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generarCodigoJugadorUnico(callback) {
  const codigo = generarCodigoJugador();
  const sql = 'SELECT * FROM jugador WHERE codigo = ?';
  connection.query(sql, [codigo], (err, resultados) => {
    if (err) return callback(err);
    if (resultados.length > 0) {
      // Ya existe, genera otro
      return generarCodigoJugadorUnico(callback);
    } else {
      // Código único
      return callback(null, codigo);
    }
  });
}

exports.unirseAPartida = (req, res) => {
  const { nombre, pin } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  // Buscar la partida por PIN
  const queryBuscarPartida = 'SELECT id FROM partidas WHERE pin = ?';
  connection.query(queryBuscarPartida, [pin], (err, results) => {
    if (err) {
      console.error('Error al buscar la partida:', err);
      return res.status(500).json({ error: 'Error al buscar la partida' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }

    const partidaId = results[0].id;

    // Generar código jugador único antes de insertar
    generarCodigoJugadorUnico((err2, codigoUnico) => {
      if (err2) {
        console.error('Error generando código único:', err2);
        return res.status(500).json({ error: 'Error interno generando código' });
      }

      const queryInsertJugador = 'INSERT INTO jugador (nombre, partida_id, codigo) VALUES (?, ?, ?)';
      connection.query(queryInsertJugador, [nombre.trim(), partidaId, codigoUnico], (err3, result3) => {
        if (err3) {
          console.error('Error al registrar jugador:', err3);
          return res.status(500).json({ error: 'Error al registrar jugador' });
        }

        console.log(`Jugador registrado: ID ${result3.insertId}, Código ${codigoUnico}`);
        return res.status(201).json({
          mensaje: 'Jugador registrado correctamente',
          jugador_id: result3.insertId,
          codigo: codigoUnico
        });
      });
    });
  });
};



  exports.obtenerJugadoresPorPartida = (req, res) => {
    const { pin } = req.params;
  
    const query = `
      SELECT jugador.nombre
      FROM jugador
      JOIN partidas ON jugador.partida_id = partidas.id
      WHERE partidas.pin = ?
    `;
  
    connection.query(query, [pin], (err, results) => {
      if (err) {
        console.error('Error al obtener jugadores:', err);
        return res.status(500).json({ error: 'Error al obtener jugadores' });
      }
  
      return res.status(200).json(results);
    });
  };

  exports.obtenerJugadoresPorPartida = (req, res) => {
    const { pin } = req.params;
  
    const query = `
      SELECT jugador.nombre
      FROM jugador
      JOIN partidas ON jugador.partida_id = partidas.id
      WHERE partidas.pin = ?
    `;
  
    connection.query(query, [pin], (err, results) => {
      if (err) {
        console.error('Error al obtener jugadores:', err);
        return res.status(500).json({ error: 'Error al obtener jugadores' });
      }
  
      return res.status(200).json(results);
    });
  };
  
  exports.obtenerRankingPorPin = (req, res) => {
    const { pin } = req.params;
  
    const sql = `
      SELECT 
        jugador.nombre, 
        SUM(jugadores_nivel.puntos) AS total_puntos, 
        MAX(jugadores_nivel.nivel_id) AS nivel_alcanzado
      FROM jugador
      JOIN partidas ON jugador.partida_id = partidas.id
      LEFT JOIN jugadores_nivel jugadores_nivel ON jugador.id = jugadores_nivel.jugador_id
      WHERE partidas.pin = ?
      GROUP BY jugador.id
      ORDER BY total_puntos DESC
    `;
  
    connection.query(sql, [pin], (err, results) => {
      if (err) {
        console.error('Error al obtener ranking:', err);
        res.status(500).json({ error: 'Error en el servidor' });
      } else {
        res.json(results);
      }
    });
  };


