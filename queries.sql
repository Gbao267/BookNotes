create table books(
	id serial primary key,
	cover_i text,
	name text,
	introduction text,
	rating integer,
	date_read date not null
);

create table notes(
	id serial primary key,
	note text,
	book_id integer not null REFERENCES books(id)
);