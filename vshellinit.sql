create table if not exists course_info
(
	id int not null primary key auto_increment,
	course_code varchar(9),
	course_name varchar(250),
	description text,
	active boolean default true
);

create table if not exists course_prerequisite
(
	course_id varchar(9),
	prereq_id varchar(9),
	coreq boolean default false
);

create table if not exists faq
(
	id int not null primary key auto_increment,
	question varchar(255),
	answer varchar(65000),
	`key` varchar(20)
);

create table if not exists important_dates
(
	id int not null primary key auto_increment,
	year int(4) not null,
	semester char,
	start_date date,
	end_date date,
	description varchar(500),
	`key` varchar(32),
	active boolean default true not null
);


