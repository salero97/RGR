--
-- PostgreSQL database dump
--

\restrict AF3WBHfauFJIbzZ16cCAh3dVq6BgP7TogRINe4wHbzTXnTlCtvYRc3grQhbSPSl

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: buildingrisklevel; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.buildingrisklevel AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.buildingrisklevel OWNER TO admin;

--
-- Name: buildingstatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.buildingstatus AS ENUM (
    'new',
    'inprogress',
    'resolved',
    'falsealarm'
);


ALTER TYPE public.buildingstatus OWNER TO admin;

--
-- Name: incidentseverity; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.incidentseverity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public.incidentseverity OWNER TO admin;

--
-- Name: incidentstatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.incidentstatus AS ENUM (
    'new',
    'inprogress',
    'resolved',
    'falsealarm'
);


ALTER TYPE public.incidentstatus OWNER TO admin;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.userrole AS ENUM (
    'admin',
    'dispatcher',
    'user'
);


ALTER TYPE public.userrole OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    object_type character varying(50),
    object_id character varying(50),
    details jsonb,
    ip_address character varying(64),
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO admin;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO admin;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: buildings; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.buildings (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    house character varying(50),
    floors integer,
    risklevel public.buildingrisklevel DEFAULT 'medium'::public.buildingrisklevel NOT NULL,
    status public.buildingstatus DEFAULT 'new'::public.buildingstatus NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    latitude double precision,
    longitude double precision,
    createdat timestamp with time zone DEFAULT now() NOT NULL,
    updatedat timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.buildings OWNER TO admin;

--
-- Name: buildings_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.buildings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.buildings_id_seq OWNER TO admin;

--
-- Name: buildings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.buildings_id_seq OWNED BY public.buildings.id;


--
-- Name: incidentlogs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.incidentlogs (
    id integer NOT NULL,
    incidentid integer NOT NULL,
    userid uuid,
    action text NOT NULL,
    createdat timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.incidentlogs OWNER TO admin;

--
-- Name: incidentlogs_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.incidentlogs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.incidentlogs_id_seq OWNER TO admin;

--
-- Name: incidentlogs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.incidentlogs_id_seq OWNED BY public.incidentlogs.id;


--
-- Name: incidents; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.incidents (
    id integer NOT NULL,
    address text NOT NULL,
    house character varying(50) NOT NULL,
    floor integer NOT NULL,
    apartment character varying(50),
    threattype character varying(255) NOT NULL,
    severity public.incidentseverity NOT NULL,
    status public.incidentstatus DEFAULT 'new'::public.incidentstatus NOT NULL,
    responsible character varying(255) NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    latitude double precision,
    longitude double precision,
    geocodingstatus character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    geocodingmessage text,
    createdby uuid,
    createdat timestamp with time zone DEFAULT now() NOT NULL,
    updatedat timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.incidents OWNER TO admin;

--
-- Name: incidents_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.incidents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.incidents_id_seq OWNER TO admin;

--
-- Name: incidents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.incidents_id_seq OWNED BY public.incidents.id;


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.login_attempts (
    id integer NOT NULL,
    ip character varying(64) NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    last_attempt timestamp with time zone DEFAULT now() NOT NULL,
    blocked_until timestamp with time zone
);


ALTER TABLE public.login_attempts OWNER TO admin;

--
-- Name: login_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.login_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.login_attempts_id_seq OWNER TO admin;

--
-- Name: login_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.login_attempts_id_seq OWNED BY public.login_attempts.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.refresh_tokens_id_seq OWNER TO admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: sensors; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.sensors (
    id integer NOT NULL,
    building_id integer NOT NULL,
    type character varying(100) NOT NULL,
    location character varying(255),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sensors OWNER TO admin;

--
-- Name: sensors_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.sensors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sensors_id_seq OWNER TO admin;

--
-- Name: sensors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.sensors_id_seq OWNED BY public.sensors.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50),
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role public.userrole DEFAULT 'dispatcher'::public.userrole NOT NULL,
    full_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: buildings id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.buildings ALTER COLUMN id SET DEFAULT nextval('public.buildings_id_seq'::regclass);


--
-- Name: incidentlogs id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incidentlogs ALTER COLUMN id SET DEFAULT nextval('public.incidentlogs_id_seq'::regclass);


--
-- Name: incidents id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incidents ALTER COLUMN id SET DEFAULT nextval('public.incidents_id_seq'::regclass);


--
-- Name: login_attempts id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.login_attempts ALTER COLUMN id SET DEFAULT nextval('public.login_attempts_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: sensors id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sensors ALTER COLUMN id SET DEFAULT nextval('public.sensors_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.audit_logs (id, user_id, action, object_type, object_id, details, ip_address, user_agent, created_at) FROM stdin;
1	c4feac4e-1770-4988-aa15-01e6367d5eda	LOGIN_SUCCESS	user	c4feac4e-1770-4988-aa15-01e6367d5eda	{"email": "admin@example.com"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:51:41.514133+00
2	c4feac4e-1770-4988-aa15-01e6367d5eda	LOGOUT_SUCCESS	user	c4feac4e-1770-4988-aa15-01e6367d5eda	{}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:51:54.781471+00
3	c4feac4e-1770-4988-aa15-01e6367d5eda	LOGIN_FAILED	user	c4feac4e-1770-4988-aa15-01e6367d5eda	{"reason": "invalid_credentials"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:51:56.665145+00
4	c4feac4e-1770-4988-aa15-01e6367d5eda	LOGIN_FAILED	user	c4feac4e-1770-4988-aa15-01e6367d5eda	{"reason": "invalid_credentials"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:51:57.83106+00
5	c4feac4e-1770-4988-aa15-01e6367d5eda	LOGIN_FAILED	user	c4feac4e-1770-4988-aa15-01e6367d5eda	{"reason": "invalid_credentials"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:51:58.549451+00
6	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T11:01:58.546Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:51:58.99278+00
7	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T11:01:58.546Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:52:00.592415+00
8	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T11:01:58.546Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:52:01.315076+00
9	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T11:01:58.546Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:52:01.710451+00
10	d17ab688-331a-4ca8-bc5c-f860c449e52c	REGISTER_SUCCESS	user	d17ab688-331a-4ca8-bc5c-f860c449e52c	{"role": "user", "email": "admin1@example.com"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:52:26.862385+00
11	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T11:01:58.546Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:52:52.36537+00
12	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T11:01:58.546Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 10:52:53.582315+00
13	9b020831-3d8c-4744-828d-c71ee93ced53	REGISTER_SUCCESS	user	9b020831-3d8c-4744-828d-c71ee93ced53	{"role": "user", "email": "test@example.com"}	::ffff:172.18.0.1	curl/8.21.0	2026-08-27 11:54:19.682446+00
14	9b020831-3d8c-4744-828d-c71ee93ced53	LOGIN_SUCCESS	user	9b020831-3d8c-4744-828d-c71ee93ced53	{"email": "test@example.com"}	::ffff:172.18.0.1	curl/8.21.0	2026-08-27 11:54:42.408804+00
15	9b020831-3d8c-4744-828d-c71ee93ced53	LOGIN_FAILED	user	9b020831-3d8c-4744-828d-c71ee93ced53	{"reason": "invalid_credentials"}	::ffff:172.18.0.1	curl/8.21.0	2026-08-27 11:56:52.243106+00
16	9b020831-3d8c-4744-828d-c71ee93ced53	LOGIN_FAILED	user	9b020831-3d8c-4744-828d-c71ee93ced53	{"reason": "invalid_credentials"}	::ffff:172.18.0.1	curl/8.21.0	2026-08-27 11:56:52.432707+00
17	9b020831-3d8c-4744-828d-c71ee93ced53	LOGIN_FAILED	user	9b020831-3d8c-4744-828d-c71ee93ced53	{"reason": "invalid_credentials"}	::ffff:172.18.0.1	curl/8.21.0	2026-08-27 11:56:52.621127+00
18	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T12:06:52.617Z"}	::ffff:172.18.0.1	curl/8.21.0	2026-08-27 11:56:52.629794+00
19	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T12:06:52.617Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 11:59:08.966369+00
20	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T12:06:52.617Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 11:59:11.076773+00
21	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T12:06:52.617Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 11:59:18.698888+00
22	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T12:06:52.617Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 11:59:20.326904+00
23	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T12:06:52.617Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 11:59:29.319289+00
24	\N	LOGIN_BLOCKED	auth	::ffff:172.18.0.1	{"blockedUntil": "2026-08-27T12:06:52.617Z"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 11:59:31.826283+00
25	c4feac4e-1770-4988-aa15-01e6367d5eda	LOGIN_SUCCESS	user	c4feac4e-1770-4988-aa15-01e6367d5eda	{"email": "admin@example.com"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 12:08:50.884856+00
26	c4feac4e-1770-4988-aa15-01e6367d5eda	LOGIN_SUCCESS	user	c4feac4e-1770-4988-aa15-01e6367d5eda	{"email": "admin@example.com"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 12:08:57.81146+00
27	c4feac4e-1770-4988-aa15-01e6367d5eda	CREATE_INCIDENT	incident	1	{"house": "1", "address": "1", "threattype": "Пожар"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 12:09:37.845992+00
28	c4feac4e-1770-4988-aa15-01e6367d5eda	LOGOUT_SUCCESS	user	c4feac4e-1770-4988-aa15-01e6367d5eda	{}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 12:11:14.526675+00
29	c4feac4e-1770-4988-aa15-01e6367d5eda	LOGIN_SUCCESS	user	c4feac4e-1770-4988-aa15-01e6367d5eda	{"email": "admin@example.com"}	::ffff:172.18.0.1	Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0	2026-08-27 12:11:15.804215+00
\.


--
-- Data for Name: buildings; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.buildings (id, name, address, house, floors, risklevel, status, description, latitude, longitude, createdat, updatedat) FROM stdin;
\.


--
-- Data for Name: incidentlogs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.incidentlogs (id, incidentid, userid, action, createdat) FROM stdin;
1	1	c4feac4e-1770-4988-aa15-01e6367d5eda	Создан инцидент	2026-08-27 12:09:37.844307+00
\.


--
-- Data for Name: incidents; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.incidents (id, address, house, floor, apartment, threattype, severity, status, responsible, description, latitude, longitude, geocodingstatus, geocodingmessage, createdby, createdat, updatedat) FROM stdin;
1	1	1	1	\N	Пожар	low	new	dds		52.4502096	20.1001978	success	Адрес успешно отмечен на карте	c4feac4e-1770-4988-aa15-01e6367d5eda	2026-08-27 12:09:37.839343+00	2026-08-27 12:09:37.839343+00
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.login_attempts (id, ip, attempts, last_attempt, blocked_until) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.refresh_tokens (id, user_id, token, expires_at, revoked, created_at) FROM stdin;
2	9b020831-3d8c-4744-828d-c71ee93ced53	6abc9fd4af7a33ec99e84ea56f298a23dce286d76dc31d41285c1182341a2e3eaeb3ff30726d9815a642bb534abda500b3ed89651383b32778afa558169c27ef	2026-09-03 11:54:42.403+00	f	2026-08-27 11:54:42.403433+00
1	c4feac4e-1770-4988-aa15-01e6367d5eda	efba5cf887fde5ceb6113b0dd9297354686acd60dd6641bc92bfab7f1eb4ba247e805101dd3d155f5c0eddbdcdb448c3992c8ead7b5246454cb7c6b6a1f7ea7b	2026-09-03 10:51:41.509+00	t	2026-08-27 10:51:41.509434+00
3	c4feac4e-1770-4988-aa15-01e6367d5eda	084478a1dd7421ebe4320546f8ee7566ca09ce4a2292b6cfe2f7bf2195973f8bf8b62fe3d8d127f35920a7e595f92573aea62e1cd3ac7772b959a864bcc65917	2026-09-03 12:08:50.882+00	t	2026-08-27 12:08:50.883136+00
4	c4feac4e-1770-4988-aa15-01e6367d5eda	6800636eff2cbfe6705d829578beb6861222a5a816503a1a31dc29b32eea7cc15eccc0977cfe4cbde2d525d93f85e1555bf5d9ef55c8df8d0ad5324e78aec936	2026-09-03 12:08:56.589+00	t	2026-08-27 12:08:56.589584+00
5	c4feac4e-1770-4988-aa15-01e6367d5eda	f033543e3559dc6cb021067652b8199338beb686f6842f53a159c4bca4fc83b55d768501ea64eaee32a35196d1e8ff536559180ad1fb44993579d9e08cdad937	2026-09-03 12:08:57.809+00	t	2026-08-27 12:08:57.809714+00
6	c4feac4e-1770-4988-aa15-01e6367d5eda	492fad1cae0f35c7483d9f18526c035aeba938fb2ecd01a91ced23a54afc63e041f542d8a070dce0d9d8de2ef59734c2ce4e7e6bda6fb9ea41b05b8e061d8813	2026-09-03 12:08:59.64+00	t	2026-08-27 12:08:59.640423+00
7	c4feac4e-1770-4988-aa15-01e6367d5eda	e2ac60939b9c2659c5d1ddd4dd6f3fb5e0a566e93d18b801f735176ab8b59d5d677edd75e9a1878d74cb2f91ed943ac29a0719a8d653a652c3b86d236e9b15c0	2026-09-03 12:09:00.992+00	t	2026-08-27 12:09:00.992237+00
8	c4feac4e-1770-4988-aa15-01e6367d5eda	dfc9df885c18ceba4766f17c91cd9362ae7df2cd000caec44343c4ec1377f94ef73423325285311a231f8df9c26191d1be237862d91ab96b5b551955f6ad9562	2026-09-03 12:09:01.486+00	t	2026-08-27 12:09:01.486503+00
9	c4feac4e-1770-4988-aa15-01e6367d5eda	9c8f76c8435f1ef536d37b90219598909d2efa99a01a27092dff3ff16bd297f2c7c96dd54942a5392563bc46094bfbd76b3d14b1ac9097d048dc646a9a4b1257	2026-09-03 12:09:04.201+00	t	2026-08-27 12:09:04.202111+00
10	c4feac4e-1770-4988-aa15-01e6367d5eda	e2a53802c60012c8e4d1e668916bd33de7e068a1e056af89ad29e7a69ee5e03d8f35101cc01e626ca64847b250e208a81b27bb08c94e43f3881b61aa95574840	2026-09-03 12:09:04.713+00	t	2026-08-27 12:09:04.713733+00
11	c4feac4e-1770-4988-aa15-01e6367d5eda	2f6e4ded909bc368cea76004b4afddaafe484d67e95bf6bc21871458875912a207424af7116a0ee2dcf47c318ce834cc8d42f71d1b86722160794d971b83589c	2026-09-03 12:09:05.093+00	t	2026-08-27 12:09:05.093169+00
12	c4feac4e-1770-4988-aa15-01e6367d5eda	046a0880240802cd31ed219a2b5f0653e044fefbd386af0ca56c8485c0801812c9c98258772a8128de8e84312acb122a7647d70ef063e768c48844539d092c70	2026-09-03 12:09:10.097+00	t	2026-08-27 12:09:10.097467+00
13	c4feac4e-1770-4988-aa15-01e6367d5eda	e115c3067831af7192a0956decabcad347de3c14c3e82c00d635871619bdc5c7679fa7915f036d5333f93ea746adde5d3440c0761b625da8e4fc7a7d49ef28d8	2026-09-03 12:09:10.591+00	t	2026-08-27 12:09:10.5912+00
14	c4feac4e-1770-4988-aa15-01e6367d5eda	dcea29ed47504e27c34906ebe9ece078cf4b678811b31e504505a47e59e60a20d4ab2c9e1e3ce5efce5f3d6bba2dcd872a44526c076c2817c4312411527603f9	2026-09-03 12:09:39.95+00	t	2026-08-27 12:09:39.950269+00
15	c4feac4e-1770-4988-aa15-01e6367d5eda	7f4ed52a0d20a31dbfa34556f7744ee533b461497f41028ebdd77ade01d18841e8b99a51f332562adf6ef3ef63691825ff6bbb0da1df2bad4832a86c7a4db47b	2026-09-03 12:09:43.432+00	t	2026-08-27 12:09:43.43228+00
16	c4feac4e-1770-4988-aa15-01e6367d5eda	87b670a11634113d497e60e9e94d9c724c41fa5f9119356918cf51775ab17157d5dcff029415fbfd7d065ecc93a30cc13377246f38069dcf3c8a82e7a42eb318	2026-09-03 12:09:51.458+00	t	2026-08-27 12:09:51.458525+00
17	c4feac4e-1770-4988-aa15-01e6367d5eda	c92e91b108ffe95eb402c82fbb4f9872a6dd186a3a5eb3c8eaff395d73983d717d964406f5d5fee3a17a9aff879b43c3d2e6f04961e8886e3acddf0cc9324d0d	2026-09-03 12:09:52.049+00	t	2026-08-27 12:09:52.049832+00
18	c4feac4e-1770-4988-aa15-01e6367d5eda	e00629fd19718fff0433c06957f5a500226528a1393f6686abf0a08bed615f6fce29d4cfbee3104c2918b9e53d281030285882db3061dc5afd832932b0ac7073	2026-09-03 12:11:15.802+00	f	2026-08-27 12:11:15.802605+00
\.


--
-- Data for Name: sensors; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.sensors (id, building_id, type, location, status, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, username, email, password_hash, role, full_name, created_at) FROM stdin;
c4feac4e-1770-4988-aa15-01e6367d5eda	admin	admin@example.com	$2b$12$sgcyi12.sweQ/r3IYy/gFOuA3QSs.dk.bJSmxtJoeYx31opaYZ6sq	admin	Administrator	2026-08-27 10:51:34.893854+00
d17ab688-331a-4ca8-bc5c-f860c449e52c	\N	admin1@example.com	$2b$12$O85z9JGYeTgVGehPP.WNd.Qylm9zTq.B5uEdIpdMKQiyB/zqdQF6e	user	Ил Ил Ил	2026-08-27 10:52:26.857582+00
9b020831-3d8c-4744-828d-c71ee93ced53	\N	test@example.com	$2b$12$rgPsOBRfJ3UgGSIPAM0Uc.8/hqikwaEecje5T0zrRs/kNbEHk748i	user	Test User	2026-08-27 11:54:19.677635+00
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 29, true);


--
-- Name: buildings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.buildings_id_seq', 1, false);


--
-- Name: incidentlogs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.incidentlogs_id_seq', 1, true);


--
-- Name: incidents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.incidents_id_seq', 1, true);


--
-- Name: login_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.login_attempts_id_seq', 2, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 18, true);


--
-- Name: sensors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.sensors_id_seq', 1, false);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: buildings buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_pkey PRIMARY KEY (id);


--
-- Name: incidentlogs incidentlogs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incidentlogs
    ADD CONSTRAINT incidentlogs_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_ip_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_ip_key UNIQUE (ip);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: sensors sensors_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sensors
    ADD CONSTRAINT sensors_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_login_attempts_ip; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_login_attempts_ip ON public.login_attempts USING btree (ip);


--
-- Name: idx_sensors_building_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_sensors_building_id ON public.sensors USING btree (building_id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidentlogs incidentlogs_incidentid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incidentlogs
    ADD CONSTRAINT incidentlogs_incidentid_fkey FOREIGN KEY (incidentid) REFERENCES public.incidents(id) ON DELETE CASCADE;


--
-- Name: incidentlogs incidentlogs_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incidentlogs
    ADD CONSTRAINT incidentlogs_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: incidents incidents_createdby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_createdby_fkey FOREIGN KEY (createdby) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sensors sensors_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.sensors
    ADD CONSTRAINT sensors_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict AF3WBHfauFJIbzZ16cCAh3dVq6BgP7TogRINe4wHbzTXnTlCtvYRc3grQhbSPSl

