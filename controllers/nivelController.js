const db = require('../db/connection');

exports.iniciarNivel = (req, res) => {
  const { partida_id, numero, tiempo_max } = req.body;

  const nivel = {
    partida_id,
    numero,
    tiempo_max,
    fecha_inicio: new Date()
  };

  db.query('INSERT INTO nivel SET ?', nivel, (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al iniciar nivel' });

    res.json({ nivel_id: result.insertId, mensaje: '🕒 Nivel iniciado' });
  });
};

exports.finalizarNivel = (req, res) => {
  const { nivel_id } = req.body;

  db.query('UPDATE nivel SET fecha_fin = NOW() WHERE id = ?', [nivel_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al finalizar nivel' });

    res.json({ mensaje: '⏹️ Nivel finalizado' });await
  });
};

exports.topNivel = (req, res) => {
    const nivel_id = req.params.nivel_id;
  
    const sql = `
      SELECT j.nombre, r.punteo
      FROM respuesta r
      JOIN jugador j ON r.jugador_id = j.id
      WHERE r.nivel_id = ?
      ORDER BY r.punteo DESC
      LIMIT 10
    `;
  
    db.query(sql, [nivel_id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener ranking del nivel' });
  
      res.json(results);
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

  exports.obtenerNivelesMatchPorJuego = (req, res) => {
    const numeroNivel = req.params.numero;

    console.log('🟡 Recibiendo ID de juego:', numeroNivel);
    console.log('📥 Nivel recibido:', numeroNivel)

  
    const query = `
      SELECT n.id AS pa_id, n.numero, p.texto_1, p.texto_2, pareja_id
      FROM nivel n
      JOIN nivel_match_pareja p ON n.id = p.nivel_id
      WHERE n.numero = ?
      ORDER BY n.numero, p.id
    `;
  
    db.query(query, [numeroNivel], (err, resultados) => {
      if (err) {
        console.error('Error al obtener las parejas:', err);
        return res.status(500).json({ error: 'Error al obtener los niveles' });
      }
  
      // Agrupar por nivel_id
      const niveles = {};
      resultados.forEach(row => {
        if (!niveles[row.nivel_id]) {
          niveles[row.nivel_id] = {
            numero: row.numero,
            parejas: []
          };
        }
        niveles[row.nivel_id].parejas.push({
          texto_1: row.texto_1,
          texto_2: row.texto_2,
          pareja_id: row.pareja_id
        });
      });
  
      // Convertir a array
      const resultadoFinal = Object.values(niveles);
      console.log(resultados)
      console.log('🟢 Resultado enviado al frontend:', resultadoFinal);
      res.json(resultadoFinal);
    });
  }; 

  exports.obtenerDatosNivelStrike = (req, res) => {
    const { nivelId } = req.params;
  
    const sql = 'SELECT * FROM jugadores_nivel WHERE nivel_id = ?';
  
    db.query(sql, [nivelId], (err, results) => {
      if (err) {
        console.error('Error al obtener nivel:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
      } else {
        if (results.length > 0) {
          res.json(results[0]);
        } else {
          res.status(404).json({ error: 'Nivel no encontrado' });
        }
      }
    });
  };

  exports.registrarResultadoNivel = (req, res) => {
    const {
      jugador_id,
      nivel_id,
      puntos,
      completado,
      objetivos,
      tiempo,
      tamaño,
      velocidad,
      pin
    } = req.body;
  
    const sql = `
      INSERT INTO jugadores_nivel (
        jugador_id, nivel_id, puntos, completado, objetivos, tiempo, tamaño, velocidad, pin
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        puntos = VALUES(puntos), 
        completado = VALUES(completado),
        objetivos = VALUES(objetivos),
        tiempo = VALUES(tiempo),
        tamaño = VALUES(tamaño),
        velocidad = VALUES(velocidad)
    `;
  
    db.query(sql, [jugador_id, nivel_id, puntos, completado, objetivos, tiempo, tamaño, velocidad, pin], (err, result) => {
      if (err) {
        console.error('Error al guardar resultado:', err);
        return res.status(500).json({ error: 'Error en la base de datos' });
      } else {
        return res.json({ success: true });
      }
    });
  };
  
  exports.obtenerPreguntasPorNivel = (req, res) => {
    const nivel_id = parseInt(req.params.nivel_id);
  
    if (isNaN(nivel_id)) {
      return res.status(400).json({ error: 'Nivel inválido' });
    }
  
    // Niveles 1–5 → 2 preguntas, Niveles 6–10 → 3 preguntas
    const limite = nivel_id <= 5 ? 2 : 3;
  
    const sql = `
      SELECT id, nivel_id, pregunta, opcion_1, opcion_2, opcion_3, opcion_4
      FROM preguntas
      WHERE nivel_id = ?
      ORDER BY RAND()
      LIMIT ?
    `;
  
    db.query(sql, [nivel_id, limite], (err, resultados) => {
      if (err) {
        console.error('Error al obtener preguntas:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
  
      res.json({ preguntas: resultados });
    });
  };

  exports.obtenerParejasMatch = (req, res) => {
    const nivelId = req.params.nivel_id;
  
    const sql = `
      SELECT texto_1, texto_2, pareja_id
      FROM nivel_match_pareja
      WHERE nivel_id = ?
    `;
  
    db.query(sql, [nivelId], (err, result) => {
      if (err) {
        console.error("Error al obtener parejas:", err);
        return res.status(500).json({ error: "Error en la base de datos" });
      }
  
      return res.json(result);
    });
  };
  