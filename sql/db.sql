create database farmacia;

drop table if exists reservas;
drop table if exists prescripciones;
drop table if exists descartados;
drop table if exists stock;
drop table if exists usuarios;

create table usuarios(
    id serial primary key,
    correo varchar(50) not null,
    clave varchar(20) not null
);

create table stock(
    id serial primary key,
    medicamento varchar(50) not null,
    codigo int not null,
    descripcion varchar(300) not null,
    fabricante varchar(50) not null,
    peso int not null,
    medida varchar(5) not null,
    unidad int not null,
    caja int not null,
    total int not null check (total > -1),
    id_usuario int not null,
    foreign key(id_usuario) references usuarios(id)
);

create table descartados(
    id serial primary key,
    motivo varchar(100) not null,
    cantidad int not null,
    id_stock int not null,
    foreign key(id_stock) references stock(id)
);

create table prescripciones(
    id serial primary key,
    id_receta int not null,
    rut varchar(10) not null,
    correo varchar(50) not null,
    paciente varchar(100) not null,
    medicamento varchar(50) not null,
    cantidad int not null,
    dias int not null,
    estado varchar(20) not null, 
    id_stock int not null,
    foreign key(id_stock) references stock(id)
);

-- cantidad se deja en cero si se escoje opcion de no reservar
create table reservas(
    id serial primary key,
    cantidad int not null, 
    notificacion varchar(20) not null,
    id_prescripcion int not null,
    foreign key(id_prescripcion) references prescripciones(id)
);

-- tabla que no se ocupo
create table entregas(
    id serial primary key,
    rut,
    paciente,
    medicamento,
    cantidad,
    estado,
    foreign key(id_prescripcion) references prescripciones(id)
);