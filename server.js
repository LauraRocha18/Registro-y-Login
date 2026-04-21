//Importar y configurar DNS (SIEMPRE ARRIBA) para conectarse a mi servidor de la base de datos.
// Esto ayuda a resolver problemas de conexión con MongoDB (mongodb+srv)
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);// Servidores DNS de Cloudflare y Google

//Importar dependencias principales
import express from "express";// Framework para crear el servidor
import mongoose from "mongoose";// ORM para MongoDB
import jwt from "jsonwebtoken";// Librería para generar tokens JWT


const app = express();//Crear aplicación Express
app.use(express.json());//Middleware para permitir recibir datos en formato JSON

//Conexión a MongoDB 
mongoose.connect("mongodb+srv://laurapatriciarocha880_db_user:wKGMbWE9p8YZ8OIt@cluster0.ntcmdv3.mongodb.net/Tienda_Prueba?appName=Cluster0")
    .then(() => console.log("Conectado a la base de datos correctamente!"))
    .catch(err => console.log("Error:", err));

//Definición del esquema de usuarios (estructura de la colección)
const UsuariosSchema = new mongoose.Schema({
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    correo: { type: String, required: true },
    contrasena: { type: String, required: true },
    telefono: { type: String, required: true },
    fecha_nacimiento: { type: String, required: true },
    direccion: { type: String, required: true },
    fecha_creacion: { type: String, required: true },
    activo: { type: Boolean, required: true },
});

//Crear el modelo basado en el esquema
const Usuarios = mongoose.model("Usuarios", UsuariosSchema);

//Método para registrar un usuario
app.post("/registrar", async (req, res) => {
    try {
        //Extraer datos del body
        const { nombres, apellidos, correo, contrasena, telefono, fecha_nacimiento, direccion, fecha_creacion } = req.body;

        //Validación básica de campos obligatorios
        if (!nombres || !correo) {
            return res.status(400).json({ mensaje: "Nombres y correo son obligatorios" });
        }

        //Verificar si el correo ya existe en la base de datos
        const usuario = await Usuarios.findOne({ correo });
        if (usuario) {
            return res.status(400).json({ mensaje: "El correo ya se encuentra registrado" });
        }


        const hoy = new Date();
        const fechaFormateada = hoy.getFullYear() + '-' +
            String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
            String(hoy.getDate()).padStart(2, '0');

        //Crear nuevo usuario
        const nuevoUsuario = new Usuarios({
            nombres,
            apellidos,
            correo,
            contrasena,
            telefono,
            fecha_nacimiento,
            direccion,
            fecha_creacion: fechaFormateada,
            activo: true
        });
        //Guardar en base de datos
        const resultado = await nuevoUsuario.save();

        //Generar token JWT
        const t = generar_token(resultado._id, resultado.correo)

        //Respuesta exitosa
        res.status(201).json({
            mensaje: "Usuario creado correctamente",
            id: resultado._id,
            token: t.token,
            expiracion: t.expiracion
        });

    } catch (error) {

        //Manejo de errores
        res.status(500).json({
            mensaje: "Error al crear usuario",
            error: error.message
        });
    }
});
//Método de login
app.post("/login", async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        //Validar datos
        if (!correo || !contrasena) {
            return res.status(400).json({ mensaje: "Correo y contraseña son obligatorios" });
        }

        //Buscar usuario por correo
        const usuario = await Usuarios.findOne({ correo });
        if (!usuario) {
            return res.status(404).json({ mensaje: "Usuario y/o contraseña incorrecta" });
        }

        //Comparar contraseña
        const esValida = contrasena == usuario.contrasena;
        if (!esValida) {
            return res.status(401).json({ mensaje: "Usuario y/o contraseña incorrecta" });
        }

        //Generar token JWT
        const t = generar_token(usuario._id, usuario.correo);

        //Respuesta exitosa
        res.json({
            mensaje: "Login exitoso",
            token: t.token,
            expiracion: t.expiracion
        });

    } catch (error) {
        //Manejo de errores
        res.status(500).json({
            mensaje: "Error en el login",
            error: error.message
        });
    }
});

//Función para generar JWT
function generar_token(id, correo) {
    const expiresIn = "2h";

    //Crear token con payload (datos del usuario)
    const token = jwt.sign(
        { id, correo: correo },
        "MICLAVESECRETA", // Contraseña privada para crear los JWT
        { expiresIn }
    );

    //Calcular fecha de expiración manual
    const expiracion = new Date(Date.now() + 2 * 60 * 60 * 1000);

    return { token, expiracion };
}
//Levantar servidor en el puerto 4000
app.listen(4000, () => {
    console.log("Servidor corriendo en http://localhost:4000");
});