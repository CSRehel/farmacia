const express = require('express')
const app = express()
const exphbs = require('express-handlebars')
const bodyParser = require('body-parser')
const ls = require('local-storage');

const { 
    autenticacionUsuario, 
    ingresoStock,
    registroPrescripcion,
    obtenerPrescripciones,
    obtenerIdStock,
    obtenerStock,
    actualizarStock,
    entregaMedicamento,
    obtenerEntregas,
    registroReserva,
    obtenerReservas,
    obtenerMedicamentos,
    registroDescarte,
    verificarReserva
} = require('./consultas')

const { send } = require('./correo')

app.listen(5000, console.log('OK'))

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(__dirname + '/public/'))
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'))

app.engine(
    'handlebars',
    exphbs.engine({
        defaultLayout: 'main',
        layoutsDir: `${__dirname}/views/mainLayout`
    })
)

app.set('view engine', 'handlebars')

// rutas -------------------------------------------------------------------------------------------------------

// vista home
app.get('/', (req, res) => {
    res.render('Home')
})

// vista login
app.get('/login', (req, res) => {
    res.render('Login')
})

// autenticación login
app.post('/login', async (req, res) => {

    const { correo, clave } = req.body

    try {
        const user = await autenticacionUsuario(correo, clave)
    
        ls.set('id_usuario', user.id)
        
        if(user){
            res.render('Home')
        }else if (user == undefined) {
            res.status(404).render('Login', {message: `Usuario y/o contraseña incorrectos`, code: 500})
        }
    } catch (e) {
        res.status(500).render('Login', {message: `Usuario no registrado`, code: 500})
    }
})

// vista stock
app.get('/stock', async (req, res) => {
    const medicamentos = await obtenerMedicamentos()
    res.render('Stock', {medicamentos})
})

// ingreso de stock
app.post('/stock', async (req, res) => {
    const { medicamento, codigo, descripcion, fabricante, peso, medida, unidad, caja } = req.body
    const id_usuario = ls.get('id_usuario')

    try {
        await ingresoStock(medicamento, codigo, descripcion, fabricante, peso, medida, unidad, caja, id_usuario)
        res.redirect('/')

    } catch (e) {
        res.status(500).render('Stock', {message: `Error al guardar los datos`, code: 500})
    }
})

// actualizar stock, verificacion de reserva y envio de correo
app.put('/stock', async (req, res) => {
    const { medicamento, caja } = req.body

    try {
        const stock = await actualizarStock(medicamento, caja)
        const verificar = await verificarReserva(medicamento) // pendiente ***

        if (verificar !== '') {
            if(verificar[0].total > verificar[0].cantidad){
                await send(verificar)
                res.status(200).send(stock)
            }
        }

        res.status(200).send(stock)
        
    } catch (e) {
        res.status(500).render('Stock', {message: `Error al guardar los datos`, code: 500})
    }
})

// vista reporteStock
app.get('/reporteStock', async (req, res) => {
    const stock = await obtenerStock()
    res.render('ReporteStock', {stock})
})

// vista prescripcion
app.get('/prescripcion', async (req, res) => {
    try {
        const presc = await obtenerPrescripciones()
        res.render('Prescripcion', {
            presc, 
            helpers: {
                estado: function (estado, opts) { return estado == 'pendiente' ? opts.fn(this) : opts.inverse(this); }
            }
        })

    } catch (e) {
        res.status(500).send({
            error: `Error en registro de prescripción: ${e}`,
            code: 500 
        })
    }
})

// recuperación datos desde sistema uno
app.post('/prescripcion', async (req, res) => {
    const { id_receta, rut, correo, paciente, medicamento, cantidad, dias, estado } = req.body

    try {
        const {id: id_stock} = await obtenerIdStock(medicamento)
        await registroPrescripcion(id_receta, rut, correo, paciente, medicamento, cantidad, dias, estado, id_stock)
        res.status(200).send('OK')

    } catch (e) {
        res.status(500).send({
            error: `Error en registro de prescripción: ${e}`,
            code: 500 
        })
    }
})

// vista entrega
app.get('/entrega', async (req, res) => {
    const { id_prescripcion, id_receta, rut, paciente, medicamento, cantidad, dias, estado } = req.query
    res.render('Entrega', { id_prescripcion, id_receta, rut, paciente, medicamento, cantidad, dias, estado })
})

// registro de entrega de medicamento
app.post('/entrega', async (req, res) => {
    
    const { descuento, id_prescripcion, medicamento } = req.body

    try {
        await entregaMedicamento(descuento, id_prescripcion, medicamento)
        res.status(200).redirect('/prescripcion')

    } catch (e) {
        res.status(500).render('Entrega', {message: `Error al guardar los datos`, code: 500})
    }

})

// vista reporte entrega
app.get('/reporteEntrega', async (req, res) => {

    const entregados = await obtenerEntregas()
    res.render('ReporteEntrega', {entregados})
})

// vista reserva
app.get('/reserva', async (req, res) => {
    const { id_prescripcion, id_receta, rut, correo, paciente, medicamento, cantidad, dias, estado } = req.query
    res.render('Reserva', { id_prescripcion, id_receta, rut, correo, paciente, medicamento, cantidad, dias, estado })
})

// registro de reserva
app.post('/reserva', async (req, res) => {
    const { notificacion, cantidad, id_prescripcion } = req.body

    try {
        await registroReserva(notificacion, cantidad, id_prescripcion)
        res.status(200).redirect('/prescripcion')

    } catch (e) {
        res.status(500).render('Entrega', {message: `Error al guardar los datos`, code: 500})
    }
})

// vista reporte Reserva
app.get('/reporteReserva', async (req, res) => {

    const reservas = await obtenerReservas()
    res.render('ReporteReserva', {reservas})
})

// vista descarte
app.get('/descarte', async (req, res) => {
    const medicamentos = await obtenerMedicamentos()
    res.render('Descarte', {medicamentos})
})

// registro de medicamentos descartados
app.post('/descarte', async (req, res) => {
    const { medicamento, motivo, cantidad } = req.body

    try {
        const { id: id_stock } = await obtenerIdStock(medicamento)
        await registroDescarte(medicamento, motivo, cantidad, id_stock)
        res.status(200).redirect('/')

    } catch (e) {
        res.status(500).render('Descarte', {message: `Error al guardar los datos`, code: 500})
    }
})

// cerrar sesión
app.get('/logout', (req, res) => {
    ls.remove('id_usuario')
    res.render('Login')
})

// ruta para consumir desde el otro sistema -----------------------------------------------------------
app.get('/xxx', async (req, res) => {

    try {
        const xxx = await consultaStock()
        res.status(200).send(xxx)

    } catch (e) {
        res.status(500).send({
            error: `Error: ${e}`,
            code: 500 
        })
    }
})

// vista 404 ------------------------------------------------------------------------------------------
app.get('*', (req, res) => {
    res.send('404 not found :(')
})

