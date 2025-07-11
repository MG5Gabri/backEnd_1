const db = require('../db/connection');
const { Parser } = require('json2csv');
const fs = require('fs');



function generarPin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  function generarPinUnico(callback) {
    const nuevoPin = generarPin();
    const sql = 'SELECT * FROM partidas WHERE pin = ?';
    db.query(sql, [nuevoPin], (err, resultados) => {
      if (err) return callback(err);
      if (resultados.length > 0) {
        // Ya existe, genera otro
        return generarPinUnico(callback);
      } else {
        // Pin único
        return callback(null, nuevoPin);
      }
    });
  }
  

  exports.crearPartida = (req, res) => {
    const { juego_id, cantidad_niveles } = req.body;
  
    generarPinUnico((err, pinGenerado) => {
      if (err) {
        console.error('Error al generar PIN único:', err);
        return res.status(500).json({ error: 'Error al generar PIN' });
      }
  
      const sql = 'INSERT INTO partidas (juego_id, cantidad_niveles, tiempo_por_nivel, pin) VALUES (?, ?, ?, ?)';
      db.query(sql, [juego_id, cantidad_niveles, null, pinGenerado], (err, resultado) => {
        if (err) {
          console.error('Error al crear la partida:', err);
          return res.status(500).json({ error: 'Error al crear la partida' });
        }
  
        res.json({ pin: pinGenerado, id: resultado.insertId });
      });
    });
  };
  

exports.obtenerJugadoresPorPin = (req, res) => {
    const { pin } = req.params;
  
    const sql = `
      SELECT jugador.nombre 
      FROM jugador 
      JOIN partidas ON jugador.partida_id = partidas.id 
      WHERE partidas.pin = ?
    `;
  
    db.query(sql, [pin], (err, results) => {
      if (err) {
        console.error('Error al obtener jugadores:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
      } else {
        res.json(results);
      }
    });
  };

  exports.obtenerNivelesPorPin = (req, res) => {
    const { pin } = req.params;
  
    const sql = 'SELECT cantidad_niveles FROM partidas WHERE pin = ?';
  
    db.query(sql, [pin], (err, results) => {
      if (err) {
        console.error('Error al obtener niveles:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'Partida no encontrada' });
      }
  
      res.json({ niveles: results[0].cantidad_niveles });
    });
  };
  
  exports.iniciarPartida = (req, res) => {
    const pin = req.params.pin;  // ahora lo lee desde la URL
  
    const query = 'UPDATE partidas SET estado = ? WHERE pin = ?';
    db.query(query, ['iniciada', pin], (err, result) => {
      if (err) {
        console.error('Error al iniciar partida:', err);
        return res.status(500).json({ error: 'Error al iniciar la partida' });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Partida no encontrada' });
      }
  
      return res.json({ mensaje: 'Partida iniciada correctamente' });
    });
  };
  
  

  // Obtener el estado de la partida por pin
exports.obtenerEstadoPartida = (req, res) => {
  const { pin } = req.params;

  const query = 'SELECT estado, juego_id FROM partidas WHERE pin = ?';

  db.query(query, [pin], (err, results) => {
    if (err) {
      console.error('Error al consultar estado de la partida:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Partida no encontrada' });
    }

    return res.json({ 
      estado: results[0].estado, 
      juego: results[0].juego_id
    });
  });
};

  
  
  exports.progresoNivel = (req, res) => {
    const { id, nivel_numero } = req.params;
  
    const sql = `
      SELECT 
        COUNT(*) AS total_jugadores,
        SUM(CASE WHEN jn.estado = 'completo' THEN 1 ELSE 0 END) AS completados
      FROM jugador j
      LEFT JOIN jugador_nivel jn ON j.id = jn.jugador_id AND jn.numero = ?
      WHERE j.partida_id = ?
    `;
  
    db.query(sql, [nivel_numero, id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al consultar progreso' });
  
      const { total_jugadores, completados } = results[0];
      const pendientes = total_jugadores - completados;
      res.json({ total_jugadores, completados, pendientes });
    });
  };
  exports.topFinalPartida = (req, res) => {
    const partida_id = req.params.id;
  
    const sql = `
      SELECT j.nombre, SUM(r.punteo) AS total_puntos
      FROM respuesta r
      JOIN jugador j ON r.jugador_id = j.id
      WHERE j.partida_id = ?
      GROUP BY j.id
      ORDER BY total_puntos DESC
      LIMIT 5
    `;
  
    db.query(sql, [partida_id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener top 5 final' });
  
      res.json(results);
    });
  };

  exports.posicionesFinales = (req, res) => {
    const partida_id = req.params.id;
  
    const sql = `
      SELECT j.nombre, SUM(r.punteo) AS total_puntos
      FROM respuesta r
      JOIN jugador j ON r.jugador_id = j.id
      WHERE j.partida_id = ?
      GROUP BY j.id
      ORDER BY total_puntos DESC
    `;
  
    db.query(sql, [partida_id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener posiciones' });
  
      // Agregar posición
      const ranking = results.map((jugador, index) => ({
        posicion: index + 1,
        nombre: jugador.nombre,
        punteo: jugador.total_puntos
      }));
  
      res.json(ranking);
    });
  };


exports.descargarInformeCSV = (req, res) => {
  const partida_id = req.params.id;

  const sql = `
    SELECT j.nombre AS jugador, n.numero AS nivel, r.punteo
    FROM respuesta r
    JOIN jugador j ON r.jugador_id = j.id
    JOIN nivel n ON r.nivel_id = n.id
    WHERE j.partida_id = ?
    ORDER BY j.nombre, n.numero
  `;

  db.query(sql, [partida_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al generar informe' });

    const parser = new Parser();
    const csv = parser.parse(results);

    res.header('Content-Type', 'text/csv');
    res.attachment(`informe_partida_${partida_id}.csv`);
    res.send(csv);
  });
};


exports.obtenerPreguntaPorNivel = (req, res) => {
  const nivel = req.params.nivel;
  const sql = `SELECT * FROM nivel_trivia WHERE nivel = ? LIMIT 1`;
  db.query(sql, [nivel], (err, resultado) => {
    if (err) return res.status(500).json({ error: 'Error al obtener pregunta' });
    res.json(resultado[0]);
  });
};




exports.obtenerParejasPorNivel = (req, res) => {
  const nivelId = req.params.nivelId;

  const sql = `
    SELECT texto_1, texto_2, pareja_id 
    FROM nivel_match_pareja 
    WHERE nivel_id = ?
  `;

  db.query(sql, [nivelId], (err, resultados) => {
    if (err) {
      console.error('Error al obtener parejas:', err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    res.json(resultados);
  });
};