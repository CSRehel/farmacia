const nodemailer = require('nodemailer')
us
let transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
        user: 'example@gmail.com',
        pass: 'tuclavedelcorreo'
    },
})

const send = async(verificar) => {
    let mailOptions = {
        from: 'example@gmail.com',
        to: [verificar[0].correo].concat(verificar.correo),
        subject: 'Reserva de medicamento CESFAM',
        html: `Estimado ${verificar[0].paciente}: <h6>El medicamento en reserva ${verificar[0].medicamento} asociado a la receta n° ${verificar[0].id_receta} esta disponible para su entrega. </h6><br>
        <small><b>No responder a este correo</b></small>`
    }

    try {
        const result = await transporter.sendMail(mailOptions)
    } catch (e) {
        console.log(e);
    }
}

module.exports = { send }