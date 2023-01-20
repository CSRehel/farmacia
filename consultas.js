const { Pool } = require('pg')

//cambiar datos según configuración local
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: '1234',
    database: 'farmacia',
    port: '5432',
})

//autenticación de usuario - login
async function autenticacionUsuario(correo, clave){

    const result = await pool.query(
        `SELECT * FROM usuarios WHERE correo = '${correo}' AND clave = '${clave}'`
    )
    
    const usuario = result.rows[0]
    return usuario

}

//ingreso de stock
async function ingresoStock(medicamento, codigo, descripcion, fabricante, peso, medida, unidad, caja, id_usuario){

    let total = (caja * unidad);

    const result = await pool.query(
        `insert into stock(medicamento, codigo, descripcion, fabricante, peso, medida, unidad, caja, total, id_usuario) 
        values ('${medicamento}', '${codigo}', '${descripcion}', '${fabricante}', '${peso}', '${medida}', '${unidad}', '${caja}', '${total}', '${id_usuario}') RETURNING *`
    )
    
    const stock = result.rows[0]
    return stock

}

//obtener id stock
async function obtenerIdStock(medicamento){

    try {
        const result = await pool.query(
            `SELECT id FROM stock WHERE medicamento = '${medicamento}'`
        )
        
        const id_stock = result.rows[0] //{id: '2'}
        return id_stock
    } catch (e) {
        console.log(e);
    }

}

// obtener datos para reporte stock
async function obtenerStock(){

    const result = await pool.query(
        `select * from stock order by codigo asc`
    )
    
    const reserva = result.rows
    return reserva

}

// obtener datos para reporte stock
async function actualizarStock(medicamento, caja){

    const unidad = await pool.query(`select unidad from stock where medicamento = '${medicamento}'`)
    const cant = (Object.values(unidad.rows[0]) * caja)

    const aumentarStock = {
        text: `UPDATE stock SET total = (total + $2), caja = (caja + $3) where medicamento = $1`,
        values: [medicamento, Number(cant), caja]
    }
    
    try {
        await pool.query('BEGIN')
        await pool.query(aumentarStock)
        await pool.query('COMMIT')

        return true
        
    } catch (e) {
        await pool.query('ROLLBACK')
        throw e
    }

}

//registro de prescripciones
async function registroPrescripcion(id_receta, rut, correo, paciente, medicamento, cantidad, dias, estado, id_stock){

    try {
        const result = await pool.query(
            `insert into prescripciones(id_receta, rut, correo, paciente, medicamento, cantidad, dias, estado, id_stock) 
            values ('${id_receta}', '${rut}', '${correo}', '${paciente}', '${medicamento}', '${cantidad}', '${dias}', '${estado}', ${id_stock}) RETURNING *`
        )
        
        const presc = result.rows[0]
        return presc
    } catch (e) {
        console.log(e);
    }

}

// obtener datos para tabla de prescripciones pendientes
async function obtenerPrescripciones(){

    const result = await pool.query(
        `select p.*, s.total from prescripciones as p join stock as s on p.id_stock = s.id;`
    )
    
    const presc = result.rows
    return presc

}

// descuenta stock, cambia estado a entregado y elimina registro de tabla prescripciones pendientes.
async function entregaMedicamento(descuento, id_prescripcion, medicamento){

    const descontarStock = {
        text: `UPDATE stock SET total = (total - $1) where medicamento = ${medicamento}`,
        values: [descuento]
    }

    const editarEstado = {
        text: "UPDATE prescripciones SET estado = 'entregado' where id = $1",
        values: [id_prescripcion]
    }
    
    try {
        await pool.query('BEGIN')
        await pool.query(descontarStock)
        await pool.query(editarEstado)
        await pool.query('COMMIT')

        return true
        
    } catch (e) {
        await pool.query('ROLLBACK')
        throw e
    }

}

// obtener datos para reporte entrega
async function obtenerEntregas(){

    const result = await pool.query(
        `SELECT * FROM prescripciones WHERE estado = 'entregado'`
    )
    
    const usuario = result.rows
    return usuario

}

// registra una reserva y cambia estado a reservado
async function registroReserva(notificacion, cantidad, id_prescripcion){

    const registrarReserva = {
        text: `insert into reservas(notificacion, cantidad, id_prescripcion) values ($1, $2, $3) RETURNING *`,
        values: [notificacion, cantidad, id_prescripcion]
    }

    const editarEstado = {
        text: "UPDATE prescripciones SET estado = 'reservado' where id = $1",
        values: [id_prescripcion]
    }
    
    try {
        await pool.query('BEGIN')
        await pool.query(registrarReserva)
        await pool.query(editarEstado)
        await pool.query('COMMIT')

        return true
        
    } catch (e) {
        await pool.query('ROLLBACK')
        console.log(e)
        throw e
    }

}

// obtener datos para reporte reservas
async function obtenerReservas(){

    const result = await pool.query(
        `select p.*, s.total from prescripciones as p join stock as s on p.id_stock = s.id where estado = 'reservado'`
    )
    
    const reserva = result.rows
    return reserva

}

// obtener datos para reporte reservas
async function obtenerMedicamentos(){

    const result = await pool.query(
        `select id, medicamento from stock;`
    )
    
    const medicamentos = result.rows
    return medicamentos

}

// registro de medicamentos descartados, descuento de stock calculado en base a las cajas * unidad
async function registroDescarte(medicamento, motivo, cantidad, id_stock){

    const unidad = await pool.query(`select unidad from stock where medicamento = '${medicamento}'`)
    const desc = (Object.values(unidad.rows[0]) * cantidad)

    const descontarStock = {
        text: `UPDATE stock SET total = (total - $2), caja = (caja - $3) where medicamento = $1`,
        values: [medicamento, Number(desc), cantidad]
    }

    const registrarMedDesc = {
        text: `insert into descartados(motivo, cantidad, id_stock) values ($1, $2, $3) RETURNING *`,
        values: [motivo, cantidad, id_stock]
    }
    
    try {
        await pool.query('BEGIN')
        await pool.query(descontarStock)
        await pool.query(registrarMedDesc)
        await pool.query('COMMIT')

        return true
        
    } catch (e) {
        await pool.query('ROLLBACK')
        throw e
    }

}

// recoge datos de la primera reserva segun medicamento actualizado
async function verificarReserva(medicamento){
    const result = await pool.query(
        `select p.id_receta, p.medicamento, p.paciente, p.correo, p.cantidad, s.total from prescripciones as p 
        join stock as s on p.id_stock = s.id
        where p.estado = 'reservado' and p.medicamento = '${medicamento}';`
    )
    
    const verificar = result.rows
    return verificar
}

module.exports = { 
    autenticacionUsuario,
    ingresoStock,
    registroPrescripcion,
    obtenerIdStock,
    obtenerStock,
    actualizarStock,
    obtenerPrescripciones,
    entregaMedicamento,
    obtenerEntregas,
    registroReserva,
    obtenerReservas,
    obtenerMedicamentos,
    registroDescarte,
    verificarReserva
}