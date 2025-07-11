const express = require('express');
const router = express.Router();
const { crearPartida, obtenerJugadoresPorPin, obtenerNivelesPorPin, iniciarPartida, 
    obtenerEstadoPartida, progresoNivel, topFinalPartida, posicionesFinales, 
    descargarInformeCSV, obtenerPreguntaPorNivel, obtenerParejasPorNivel } = require('../controllers/partidaController');

router.post('/crear', crearPartida);

router.get('/jugadores/:pin', obtenerJugadoresPorPin);

router.get('/niveles/:pin', obtenerNivelesPorPin);

router.post('/iniciar/:pin', iniciarPartida);

router.get('/estado/:pin', obtenerEstadoPartida);

router.get('/:id/nivel/:nivel_numero/progreso', progresoNivel);

router.get('/:id/top5', topFinalPartida);

router.get('/:id/posiciones', posicionesFinales);

router.get('/:id/informe', descargarInformeCSV);

router.get('/trivia/nivel/:nivel', obtenerPreguntaPorNivel);

router.get('/match/nivel/:nivelId', obtenerParejasPorNivel);


module.exports = router;
