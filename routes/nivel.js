const express = require('express');
const router = express.Router();
const { iniciarNivel, finalizarNivel, topNivel, obtenerNivelesMatchPorJuego, 
    obtenerDatosNivelStrike, registrarResultadoNivel, obtenerPreguntasPorNivel, 
    obtenerParejasMatch} = require('../controllers/nivelController');

router.post('/iniciar', iniciarNivel);
router.post('/finalizar', finalizarNivel);
router.get('/:nivel_id/top', topNivel);
router.get('/match/:numero', obtenerNivelesMatchPorJuego);

router.post('/guardar', registrarResultadoNivel)

router.get('/datos/:nivelId', obtenerDatosNivelStrike);

router.get('/pregunta/:pin/:nivel_id', obtenerPreguntasPorNivel);

router.get('/match/parejas/:nivel_id', obtenerParejasMatch);


module.exports = router;
