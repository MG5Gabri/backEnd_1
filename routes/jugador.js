const express = require('express');
const router = express.Router();
const { unirseAPartida, obtenerJugadoresPorPartida, obtenerRankingPorPin, registrarJugador } = require('../controllers/jugadorController');


router.post('/unir', unirseAPartida);

router.get('/jugadores/:pin', obtenerJugadoresPorPartida);

router.get('/ranking/:pin', obtenerRankingPorPin);



module.exports = router;

