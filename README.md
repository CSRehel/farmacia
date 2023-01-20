# Sistema de farmacia 💊

El año pasado, un estudiante de Ingeniería Informática me pidió que le desarrollara el back-end de un sistema de farmacia que se comunicara con otro sistema 
(solo para medicos) que estaba desarrollando su compañero en C# .NET.

Este proyecto lo desarrollé con lo que recién iba aprendiendo en el bootcamp de Desarrollo de Aplicaciones Web Full Stack JavaScript (Desafío Latam), 
por lo que la calidad de mi código no es nada ortodoxa. Este es el proyecto original, puedes ver la versión mejorada AQUI.

## 💊 Este proyecto consta de:

* Login.
* Registro y actualización de stock.
* Descuento de stock por medicamento entregado, expirado o caja con daños.
* Reserva de medicamentos para cuando no hay stock suficiente.
* Envío de notificación por correo cuando hay stock suficiente del medicamento reservado.
* Reporte de medicamentos y stock total.
* Integración desde el otro sistema simulado desde postman/insomnia.

## 💊 Este proyecto está construido con:

* JavaScript 
* NodeJs 
* Express
* PostgreSQL
* Handlebars

## 💊 Descarga y prueba del proyecto

Si deseas descargar y ver el proyecto funcionando, te indico algunos detallitos que debes tener en consideración:

* En la carpeta ```sql``` se encuentra el archivo ```db.sql``` con la base de datos que he ocupado para este proyecto. Considere que tanto las vistas 
como la base de datos las obtuve de otras personas y que fui modificándolas conforme iba avanzando en el desarrollo.

* En el archivo ```consultas.js``` está la conexión a la base de datos. Por efectos de falta de conocimiento, cuando desarrolle este pequeño proyecto
no sabía de la existencia de las variables de entorno, asi que debe colocar los datos de conexión de base de datos directamente en este archivo.

```
const { Pool } = require('pg')

const pool = new Pool({
    user: 'tu_usuario',
    host: 'localhost',
    password: 'tu_contraseña',
    database: 'farmacia',
    port: '5432',
})
```

* Para el funcionamiento del envío de correos, se debe proporcionar un correo gmail y su contraseña. De nuevo, esto debe ponerse directamente en el archivo
```correo.js```. No te preocupes si no funciona, esto se debe a que debes configurar tu correo para "apps menos seguras". Te dejo un 
[link](https://youtu.be/RpSQQIGTpTM?t=137) a un video de youtube donde explican el paso a paso.

```
const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'example@gmail.com', // poner correo
        pass: 'contraseña_generada'   // poner contraseña que genera gmail en configuración de apps no seguras
    },
})

const send = async(verificar) => {
    let mailOptions = {
        from: 'example@gmail.com', //repetir correo
        ...
}}
```
