const db = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM profesor WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send('Profesor no encontrado');

    const profesor = results[0];
    bcrypt.compare(password, profesor.password_hash, (err, result) => {
      if (!result) return res.status(401).send('Contraseña incorrecta');

      const token = jwt.sign({ id: profesor.id }, 'secreto123', { expiresIn: '2h' });
      res.json({ token, profesor: { id: profesor.id, nombre: profesor.nombre } });
    });
  });
};
