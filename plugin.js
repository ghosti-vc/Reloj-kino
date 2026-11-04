Vas a escribir un plugin de Kino: un repositorio público de GitHub con kino-plugin.json y un
módulo ES de JavaScript (plugin.js) que la app Kino (video, TV en vivo, música y podcasts) ejecuta
en un sandbox de QuickJS.

Puede que yo no sepa programar. Explícame cada paso en español sencillo, ejecuta tú los comandos
(antes dime cuál y para qué), pregúntame antes de cualquier cosa que no se pueda deshacer (borrar,
publicar, subir a GitHub) y, cuando algo lo tenga que hacer yo en GitHub o en Kino, dame los clics
exactos.

La interfaz del plugin (esta regla va primero): para cualquier plugin que necesite su propia pantalla,
configuración, bienvenida, tablero o panel, constrúyela con las pantallas de Kino: apiVersion 14, la capacidad
"screen" con los exports screen() y screenEvent(), componentes al estilo Flutter (Scaffold, AppBar, TabBar,
ListTile, Card, Form, TextField, el nodo "settings"...), valores por tamaño, el celular y el TV dibujados desde el
mismo árbol. Deja el formulario de ajustes viejo y el formato de panel anterior solo por compatibilidad. apiVersion
14 llega con Kino 0.9.74: para seguir instalándose en un Kino anterior,
conserva tu apiVersion y ofrece la pantalla con "enhancements". Pon el código en src/ y empaquétalo en plugin.js
con esbuild (generado, guardado en git, revisado con check:built). Valida con node sdk/validate.mjs . y
node sdk/run.mjs . screen (también con --device tv). Sigue el catálogo de componentes (https://kinotvapp.github.io/kino-plugins/en/screen-components/,
https://kinotvapp.github.io/kino-plugins/en/screen-forms/, https://kinotvapp.github.io/kino-plugins/en/screen-reference/) y las reglas de foco del TV (https://kinotvapp.github.io/kino-plugins/en/screens/#tv-focus): Kino dibuja su anillo
de foco solo en los nodos que la persona puede presionar; un nodo donde el control remoto debe detenerse solo para
leerlo lleva "canRequestFocus": true.
Cada pantalla del plugin usa una sola barra compacta: su AppBar lleva mergeWithKinoBar: true y dense: true, con un
leading que es una salida real ({ close: true } en la portada, un regreso en las demás). La ruta sin nombre es "main",
la portada. Un elemento de una fila del Home que abre una pantalla usa open: { screen: { args } } y el detalle se apila
desde la respuesta de open, así Atrás vuelve a la portada. Un lector usa Image fit: "width", un desplazamiento con zoom
y onScroll, y pages con reverse y progress. Prefiere un Skeleton a un spinner y una hoja inferior con un campo de
búsqueda a muchos chips; una pantalla tiene un presupuesto de 600 nodos.
(https://kinotvapp.github.io/kino-plugins/en/screen-components/#one-compact-bar)

Antes de escribir nada:
1. Lee completo https://kinotvapp.github.io/kino-plugins/AGENTS.md y síguelo como tus instrucciones.
2. Lee https://kinotvapp.github.io/kino-plugins/llms-full.txt (la guía completa, contract.json y
   kino.d.ts). Si no puedes abrir URL, dímelo y te los pego.
3. Parte de una plantilla, con "Use this template" (nunca Fork): kinotvapp/kino-plugin-archive si mi
   plugin es simple, kinotvapp/kino-plugin-own-server si necesita ajustes, sesión, descargas o canales
   en vivo (su plugin.js y su kino-plugin.json, "Tu servidor" 1.5.0, son la referencia completa de la
   API, hasta apiVersion 7). La carpeta sdk/ de la plantilla es el kit de pruebas de Node. Si mi
   plugin es de música o podcasts, lee también la sección "Música y podcasts" del contrato
   (apiVersion 8, Kino 0.9.54: https://kinotvapp.github.io/kino-plugins/contract/#music-podcasts) y usa
   kinotvapp/kino-plugin-archive-audio como el plugin de audio de referencia.
4. Si mi plugin no puede convertir lo que encuentra en una URL reproducible por sí mismo y lo entrega a otra app
   instalada en el celular o la TV (una "app resolutora"), lee https://kinotvapp.github.io/kino-plugins/resolver/ y
   "Dejar que otra app resuelva lo que encontraste" en el contrato (apiVersion 11, Kino 0.9.66). En ese caso el
   plugin solo declara "externalResolve" y responde { external: { protocol, ref } } desde resolve(); nunca toca el
   contenido por sí mismo.
5. Si dije un repositorio de Nuvio, lee https://kinotvapp.github.io/kino-plugins/nuvio-plugins/ (kino.nuvio,
   apiVersion 11, Kino 0.9.71) y copia la forma de su ejemplo completo.
6. Si mi plugin es un proveedor de sincronización (lleva la sincronización propia de Kino entre mis aparatos
   por un servicio: un bot, una API de almacenamiento, un servidor mío), lee primero
   https://kinotvapp.github.io/kino-plugins/sync-providers/ (apiVersion 12, Kino 0.9.74). Sus referencias son
   tres repositorios públicos: Sync-Gram (https://github.com/kinotvapp/kino-plugin-sync-gram, un bot de Telegram
   de la propia persona) para un servicio de terceros, Sync Servidor
   (https://github.com/kinotvapp/kino-plugin-sync-server, un servidor de Node de un solo archivo) para un
   servidor mío, y Sync-Gram Cuenta (https://github.com/kinotvapp/kino-plugin-sync-gram-account, la propia
   cuenta de Telegram de la persona por un WebSocket, apiVersion 13: sync.generateKey, una contraseña 2FA de un
   solo uso en provision, hide en settingsStatus) para una cuenta mía.
7. Si mi plugin es una tienda (una fuente de plugins para la tienda de Kino), o usa identidad o avisos, lee primero
   https://kinotvapp.github.io/kino-plugins/plugin-stores/, /store-examples/, /identity/ y /notifications/
   (apiVersion 15, Kino 0.9.77) y parte de una tienda de ejemplo con
   node sdk/init.mjs mi-tienda --host <host> --store local|live.
8. Si mi plugin usa los datos de otro plugin, o abre una puerta para otros plugins, lee primero
   https://kinotvapp.github.io/kino-plugins/protocol/ (el protocolo entre plugins: apiVersion 20, Kino 0.9.81)
   y copia los patrones de Cine Trivia (https://github.com/kinotvapp/kino-plugin-cine-trivia,
   un consumidor con la puerta de instalación) y TMDB (https://github.com/kinotvapp/kino-plugin-tmdb, un proveedor).
   Parte de la plantilla del kit: node sdk/init.mjs mi-plugin --kind provider, o --kind consumer --repo dueño/nombre
   --door <la puerta real> --call <una llamada real> (escribe "hosts": []); su test/provider
   es un reemplazo que hay que cambiar por una copia del proveedor real. Resumen en una página:
   https://kinotvapp.github.io/kino-plugins/protocol-quick/.

Lo que quiero:
- Fuente: <<< el sitio o la API, p. ej. https://example.com >>>
- Contenido: <<< películas / series / anime / TV en vivo / música / podcasts o audiolibros / un catálogo que no reproduce nada (listas o calificaciones); idioma y país >>>
- Acceso: <<< ninguno / mi usuario y contraseña del sitio / una clave de API mía (del desarrollador) que no quiero publicar / la dirección de un servidor que escribe cada persona >>>
- Qué le pregunta Kino a la persona al configurarlo: <<< nada / su usuario y contraseña / su región / la dirección de su servidor >>>
- Descargas para ver sin conexión: <<< sí / no >>>
- Otra app resuelve el stream reproducible (una app resolutora aparte en el aparato): <<< no / sí: el nombre del paquete de la app, el protocolo que responde, qué "ref" espera y cómo la consigue la gente: un APK de un release de GitHub (con su sha256), F-Droid, un código de Downloader para la TV >>>
- Scrapers de Nuvio: <<< ninguno / el repositorio de Nuvio (owner/repo) de donde el plugin saca los enlaces >>>
- Proveedor de sincronización (el plugin lleva la sincronización de Kino entre mis aparatos en vez de la red local): <<< no / sí: el servicio, si le da a cada persona un token largo y aleatorio, y si el servicio puede leer los datos sincronizados >>>
- Nombre en Kino y una descripción corta: <<< p. ej. "Mi fuente": "Películas de …, en español" >>>
- Su propia pantalla (un tablero, una configuración paso a paso, una pestaña del panel...): <<< no / sí: qué muestra y qué hace ahí la persona >>>
- Una tienda (una fuente de plugins para la tienda de Kino, apiVersion 15): <<< no / sí: local (una lista que entrega en segundo plano, desde GitHub, mi servidor o un archivo JSON estático) o en vivo (también responde mientras la persona navega: storeList y storeSearch, así que lo que busque llega a mi servidor), los hosts que usa y los plugins que lista >>>
- Identidad o avisos (apiVersion 15): <<< no / sí: quién necesita el seudónimo de Telegram de la persona (solo responde a plugins firmados con la llave de autor de Kino) y qué avisos dejar en la campanita de Inicio >>>
- Otros plugins (el protocolo entre plugins, apiVersion 20, Kino 0.9.81): <<< no / usa la puerta de otro plugin: su repositorio y su puerta (p. ej. kinotvapp/kino-plugin-tmdb, "movies") / abre una puerta: qué podrían pedirle otros plugins >>>
- Archivos del aparato de la persona (apiVersion 21, Kino 0.9.82): <<< no / sí: de qué tipo (libros, música, videos, imágenes, subtítulos), un archivo o una carpeta entera, y si solo los lee o los reproduce >>>
- Firmar el plugin con mi propia clave, para que la gente sepa que cada actualización es mía: <<< sí / no >>>
- Mi usuario de GitHub: <<< p. ej. mi-usuario >>>

Reglas que no puedes romper (el detalle y los números exactos están en AGENTS.md):
- Declara en "hosts" cada host que conozcas: los de la API y los del video, subtítulos, audio,
  segmentos y redirecciones (*.x no cubre x). Si falta uno, al abrir o reproducir un título Kino le
  pregunta a la persona una sola vez; no cuentes con eso. Si el video sale de CDN que cambian, usa
  "streamHosts": "any" (apiVersion 4; la persona lo aprueba al instalar); para canales en vivo,
  "liveStreamHosts": "any" (apiVersion 3, necesita la capacidad "channels"). Si el sitio o sus
  extractores cambian de dominio y no puedes listarlos, usa "fetchHosts": "any" (apiVersion 9, Kino
  0.9.55; la persona lo aprueba en rojo; solo por https en el puerto 443, con un cupo de peticiones, nunca la red de la casa) y revisa kino.fetchAnyHost.
  Desde Kino 0.9.45 no hay un máximo de hosts; Kino 0.9.44 y anteriores rechazan más de 20, así que si
  declaras más de 20, avísame.
- En kino-plugin.json escribe "entry": "plugin.js" e "icon": "icon.png", NUNCA "./plugin.js": Kino
  0.9.45 y anteriores rechazan un "./" al principio y el plugin no se instala.
- No es Node ni un navegador: no hay fetch, setTimeout, Buffer, process, require, crypto ni Intl;
  usa kino.fetch, kino.sleep, kino.crypto, kino.storage. Sí hay URL, URLSearchParams, atob, btoa,
  TextEncoder, TextDecoder y console. Un solo archivo, sin import.
- Nunca lances un error antes del primer await de una función async (primero await, luego valida):
  Kino 0.9.50 lo ataja, pero 0.9.49 y anteriores abortan toda la llamada, y la gente actualiza tarde.
- Usa kino.fetch siempre que encuentre el video. Solo si el embed de un servidor arma la dirección
  ejecutando sus propios scripts, usa el navegador oculto ("browser": true, apiVersion 6; me lo pregunta
  en rojo) y llama kino.browser.capture solo dentro de resolve. Nunca intentes resolver ni saltarte un
  captcha o una revisión de "confirma que eres humano": con blocked, pasa al siguiente servidor. Si un
  título tiene varios servidores o idiomas, resuelve uno y lista los demás como alternatives
  { label, ref }.
- Límites: search 15 s y las demás llamadas 20 s; 60 peticiones por llamada (cada salto de
  redirección cuenta, también los rechazados) y máximo 6 al mismo tiempo; cuerpos de 5 MB;
  256 KB de kino.storage; 100 resultados de búsqueda; Inicio con 20 filas de 60.
- Errores para la persona: kino.error("auth_required" | "not_found" | "geo_blocked" |
  "rate_limited" | "unavailable"). Con apiVersion 6 puedes agregar una frase propia,
  kino.error(code, detalle, { userMessage: "…" }): en español (o en el idioma de kino.lang, mira la
  regla del idioma), máximo 160 caracteres, sin URL ni
  dominios, sin números largos, nunca pidiendo plata, contraseñas, códigos ni contacto por fuera de
  Kino, y nunca repitiendo lo que escribió la persona (Kino la muestra como "Mensaje de <plugin>: …"
  solo si pasa todas sus reglas; un plugin que la usa para pedir plata o datos incumple las reglas y sale del índice de la comunidad).
- Home por categorías: agrupa el contenido de preferencia en las categorías de Kino
  (https://kinotvapp.github.io/kino-plugins/categories/): declara "genre" en cada fila de home() y "genres"
  en cada ítem con ids de esa lista (peliculas, series, anime, accion, comedia, drama…), manda también "year"
  e ids.tmdb, e inventa una categoría nueva solo cuando ninguna encaje.
- Contenido +18: márcalo con adult: true (apiVersion 6; Kino lo muestra solo con el código +18
  desbloqueado). Nunca intentes saltarte ese candado.
- Todo lo que lee la persona, en español de Bogotá con tuteo, nunca voseo, y los textos que arma el
  código (títulos de filas, userMessage) en el idioma de kino.lang: desde Kino 0.9.54 kino.lang puede
  ser "en-US", y entonces van en inglés (antes de 0.9.54 siempre es "es-CO").
- Música y podcasts (apiVersion 8, Kino 0.9.54): el kind "music" es un álbum, una lista o una pista;
  el kind "podcast" es un programa (también de radio) o un audiolibro; "artist" es opcional (el
  artista, o quien conduce o escribe). Si el plugin declara "episodes", episodes() tiene que responder
  por cada ref de music y podcast, aunque sea una sola pista; sin "episodes", el ref del ítem va a
  resolve. Por debajo de apiVersion 8 esos ítems se descartan.
- Playlists de la persona en el plugin (apiVersion 10, Kino 0.9.65): si el servicio tiene las listas
  PROPIAS de la persona (su cuenta, no tu catálogo), puedes declarar la capacidad "playlists"; sus
  seis funciones son cada una opcional, incluida playlists() misma. Es un contrato todavía sin
  conectar a ninguna pantalla de Kino, así que no la presentes como algo que ya se ve en la app.
  Léela en https://kinotvapp.github.io/kino-plugins/contract/#playlists antes de usarla; la mayoría
  de los plugins no la necesita.
- Otra app que resuelve lo que encontraste (apiVersion 11, Kino 0.9.66): cuando una fuente no se puede
  convertir en una URL desde el propio plugin y una app resolutora aparte, instalada por separado, lo hace,
  declara la capacidad "externalResolve" (y, para nombrar la app, el "externalResolver" del manifiesto) y
  responde { external: { protocol, ref } } desde resolve() en vez de una url. Kino nunca interpreta el
  protocolo ni el ref; le pide permiso a la persona, muestra el progreso de la app y reproduce lo que devuelve.
  Úsalo solo cuando el plugin de verdad no pueda producir una url, dale una alternativa cuando se pueda y no
  prometas que existe una app resolutora. Lee https://kinotvapp.github.io/kino-plugins/resolver/ antes de usarlo.
- Proveedores de sincronización (apiVersion 12, Kino 0.9.74), solo si te pedí uno: declara la capacidad
  "syncProvider" (puede ser la única) y exporta syncPull({ maxBlobBytes }) -> { blob, version } o null,
  syncPush({ maxBlobBytes, blob, expectedVersion }) -> { version } y, si quieres, syncStatus(null) ->
  { ready, message? }. El blob es texto cifrado en base64 que hace Kino: guárdalo y devuélvelo byte por
  byte, nunca lo decodifiques. Lanza kino.error("conflict", …) cuando la copia remota cambió desde
  expectedVersion, y kino.error("auth_required", …) cuando faltan ajustes o el servicio los rechaza.
  El manifiesto TIENE que llevar un bloque "sync" con "keySecret" (un proveedor sin él se rechaza):
  "keySecret" = la clave de un ajuste "password" con un token largo y aleatorio (nunca una contraseña que
  escoge una persona, sin "default"); Kino deriva de él la llave de sincronización en cada aparato, así
  que un segundo aparato solo necesita los mismos ajustes y ninguna llave viaja, PERO el plugin y su
  servicio pueden leer los datos y la única línea de consentimiento lo dice en rojo: dímelo. "provision"
  (obligatorio) = los ajustes que necesita un segundo aparato, incluido "keySecret". "maxBlobBytes" como
  mucho 4194304 (4 MiB; solo dentro de syncPull y syncPush puede kino.fetch mover tanto). Si el token
  cambia, todos los demás aparatos necesitan el nuevo. Nunca pongas el token en un error, una línea de
  estado o un registro.
- Ayudas para configurar (apiVersion 12): un ajuste "help" corto (qué necesita la persona y dónde lo
  consigue) y un ajuste "link" (un botón https, p. ej. https://t.me/BotFather). Desde Kino 0.9.74 una
  acción puede responder link: { candidate, confirm } (Kino pregunta "¿Eres tú, <candidate>?" antes de
  correr la acción confirm) y setSettings: { clave: valor } para llenar ajustes "text" o "select" del
  propio plugin (nunca un "url"; un "password" solo desde apiVersion 13). La acción confirm lleva "linkOnly": true, así la
  persona ve un solo botón. La preparación que un TV no puede hacer (un token que se pega en el celular)
  lleva "devices": ["phone"]: el TV la recibe con "Recibir configuración", enviada desde el celular con "Enviar configuración".
- Detecta lo que a un Kino viejo le falta: kino.meta y kino.tmdb (Kino 0.9.53) solo detrás de
  `typeof kino.meta === "function"` / `typeof kino.tmdb === "function"`, y las opciones captureAll del
  navegador oculto (Kino 0.9.54) solo cuando `kino.browser.captureAll === true`. kino.device (Kino 0.9.55)
  es "tv" o "phone" y es undefined en un Kino anterior: úsalo solo para lo que de verdad cambia en una caja
  de TV y trata todo lo que no sea "tv" como celular. Agrega kino.seed(session) (Kino 0.9.55, detrás de
  `typeof kino.seed === "function"`) SOLO a un plugin cuya fuente reparta sesiones de invitado anónimas y
  bloquee regiones para iniciar sesión: una sesión nueva que acabas de comprobar que funciona, nunca la de la
  persona, como mucho cada pocas horas y detrás de un ajuste que la persona pueda apagar. TMDB va por
  kino.tmdb, nunca con una llave en el código. Nunca exportes una función auxiliar llamada "details":
  desde apiVersion 8 es un export reservado.
- Nada secreto en el código ni en el repositorio. El usuario y la contraseña de cada persona van en
  un ajuste de tipo "password". Una clave de API mía va sellada: "secrets" en el manifiesto, sellada
  con `node sdk/seal.mjs --repo USUARIO/REPO --name nombre`, y en el código kino.secret("nombre")
  (apiVersion 4).
- Las descargas son declarativas: si la fuente lo permite, agrega "download" a "capabilities"
  (apiVersion 2) y no exportes nada extra; Kino llama a resolve él mismo cuando corre la descarga.
  Se guardan películas y capítulos en archivo normal (mp4, mkv…) o en HLS que no es en vivo; lo en
  vivo, DASH y lo que tiene DRM, nunca.
- Firmar (solo si dije que sí): "apiVersion": 5 (necesita Kino 0.9.45+). Explícame con palabras
  sencillas para qué sirve y guíame: `node sdk/seal.mjs --keygen` UNA sola vez (escribe
  kino-author-key.pem), agrega `*.pem` al .gitignore ANTES de cualquier commit, y dime que guarde una
  copia de la clave y que nunca la comparta (si se pierde, todos los que instalaron el plugin tienen
  que desinstalarlo y reinstalarlo). Luego `node sdk/seal.mjs --sign --repo USUARIO/REPO` DESPUÉS del
  último cambio en plugin.js o en "version" y otra vez después de cada cambio posterior; nunca subas
  el .pem. Nunca imprimas el contenido de la clave en el chat.
- apiVersion 13 (Kino 0.9.74; los Kino anteriores lo rechazan), solo si mi fuente lo necesita: un servicio que habla por WebSocket ("socket",
  kino.ws, wss:// a mis hosts declarados, frames como textos hex/base64), video que sirve el propio plugin
  ("byteSource": resolve responde { source: "plugin", handle, size, mime } y read({ handle, offset, length })
  responde { bytes: base64 } de exactamente ese rango, armado con kino.crypto.convert, nunca con un ciclo de
  JavaScript sobre los bytes), miles de registros para buscar ("catalog", kino.catalog), un almacenamiento
  más grande solo en el aparato ("storageLarge"), un QR en el formulario de ajustes (ajuste "qr") o el lector
  del teléfono desde una acción ("qrScan", kino.qr.scan), una contraseña que debe quedarse en un aparato como una de
  verificación en dos pasos que se manda una vez ("sync": false en ese ajuste password; sync.provision puede llevarla una vez a un aparato nuevo, nunca como
  keySecret), un proveedor de sincronización junto a "socket"/"storageLarge"/"catalog"/"qrScan" sin resolve ni
  search, una llave que crea Kino (sync.generateKey), un formulario que esconde lo que un paso no necesita
  (settingsStatus respondiendo hide: [claves]), imágenes que solo el plugin puede traer
  ("imageSource" y un export image). Lee primero https://kinotvapp.github.io/kino-plugins/bytes/,
  /catalog/, /images/ y /qr/; prueba read con node sdk/run.mjs --size <bytes> . read <handle> <offset> <length> y
  una prueba de Node (askRead o un WebSocket de mentira); revisa con typeof cada operación de bytes de kino.crypto que
  uses (dependen de la versión de Kino).
- apiVersion: el más bajo que funcione (3 para canales, 4 solo para secrets, "streamHosts": "any" o un
  ajuste de tipo "list", 5 solo para un plugin firmado, 6 solo si usas algo de apiVersion 6: estados y
  botones en los ajustes, una sección propia, colores, telemetry, migrate, firma por petición,
  userMessage, adult, canales en filas de Inicio; 6 necesita Kino 0.9.50 o más nuevo; 7 solo para
  "tracking" o "segments", y necesita Kino 0.9.51 o más nuevo; 8 solo para elementos "music" o
  "podcast" o el export details, y necesita Kino 0.9.54 o más nuevo; 9 para el panel del reproductor o
  un "fetchHosts": "any" escrito a mano (Kino 0.9.55); 10 solo para "playlists" (Kino 0.9.65); 11 solo
  para "externalResolve" (Kino 0.9.66); 12 solo para "syncProvider", el bloque "sync" o un ajuste
  "link"/"help" (Kino 0.9.74; Kino 0.9.73 y anteriores lo rechazan); 13 solo para "socket", "byteSource",
  "storageLarge", "catalog", "qrScan", "imageSource" o un ajuste "qr" (Kino 0.9.74)). Un catálogo que no reproduce
  nada declara "catalogOnly": true (Kino 0.9.54) y aun así exporta un resolve que falla con not_found,
  para los Kino anteriores. Un id nuevo y
  mío (nunca "archive-org").
- Nada de "debug": true en un plugin publicado salvo que yo lo pida: todo plugin ya tiene un
  interruptor "Modo debug" en Ajustes de Kino, y "debug": true solo lo deja encendido de entrada para todos. "telemetry" solo si yo acepto que
  los errores del plugin lleguen a Kino; registra pasos y conteos, nunca lo que escribe la persona.

Trabaja paso a paso: primero explora la fuente con peticiones reales, luego el manifiesto, luego
cada función. Después de cada paso corre `node sdk/validate.mjs .` y `node sdk/run.mjs . <función> …`
y arregla todo lo que Kino descartaría. Graba fixtures con --record y haz que
`node --test test/plugin.test.mjs` pase sin conexión. Termina con la lista de chequeo de AGENTS.md y,
antes de entregarme el plugin, corre esta autocomprobación y dime el resultado de cada línea:
- `node sdk/validate.mjs .` sale con 0 y sin problemas;
- kino-plugin.json: "entry" e "icon" sin "./" al principio; "version" subida; el apiVersion es el más
  bajo que funciona; no hay "debug": true salvo que yo lo haya pedido;
- si se firma: "signature" está en kino-plugin.json, `validate.mjs` la verificó DESPUÉS de la última
  edición, y ningún .pem está rastreado (el `.gitignore` tiene *.pem);
- cada host (video, subtítulos, segmentos, redirecciones) está en "hosts" o cubierto por un campo "any";
- para que lo encuentren: el repositorio es público y no es un fork, el topic kino-plugin está puesto,
  y el manifiesto tiene un "name" y una "description" en español;
- si no reproduce nada: "catalogOnly": true, y un resolve que falla con not_found para los Kino viejos;
- si usa scrapers de Nuvio: "apiVersion": 11, la capacidad "nuvio" y "nuvioRepos" (de 1 a 4), "streamHosts": "any",
  kino.nuvio solo dentro de las funciones y detrás de `typeof kino.nuvio === "object"`; el kit de Node lo
  responde desde una fixture (KINO_NUVIO_FIXTURE; si dice `Unknown capability`, mi kit es viejo: actualízalo, no quites la
  capacidad), y los scrapers de verdad solo se prueban en Kino 0.9.71 o más nuevo;
- si tiene música o podcasts: "apiVersion": 8, cada ítem de audio tiene kind "music" o "podcast", y
  (con "episodes") episodes() responde por cada ref de audio, aunque sea una sola pista;
- si es un proveedor de sincronización: "apiVersion": 12, "syncProvider" declarada, syncPull y syncPush
  exportadas, "sync.maxBlobBytes" de máximo 4194304, pruebas que envían y traen un blob de 4 MiB y lanzan
  "conflict", con "sync.keySecret" y "sync.provision" declarados, y me dijiste con palabras sencillas que el
  plugin y su servicio pueden leer los datos;
- si usa apiVersion 13: read tiene una prueba de
  Node que revisa cada rango byte por byte, ningún handle lleva un secreto y cada socket se cierra;
- si tiene una pantalla: el AppBar de cada pantalla lleva mergeWithKinoBar: true y dense: true con un leading que es una
  salida real, node sdk/run.mjs . screen y --device tv . screen imprimen el árbol sin nada descartado,
  cada nombre de evento que usas tiene respuesta en screenEvent y, si su apiVersion es menor que 14, la pantalla
  llega por "enhancements" y node sdk/validate.mjs . no reporta ningún bloque descartado;
- apiVersion 15 (Kino 0.9.77 o posterior). Una tienda: "capabilities": ["pluginStore"] (puede ir sola) y, si quieres, "pluginStore": { "mode": "local" |
  "live", "name" }. storeSync({ reason, since, state }) responde { full, entries, removed?, state? } y since/state pueden
  faltar en cualquier momento: cuando Kino pierde las filas de una tienda la sincroniza de nuevo desde cero, así que la
  tienda debe responder entonces su lista completa (full: true) y nunca depender de un cursor guardado. Una tienda en
  vivo (mode "live") exporta además storeList({ category, sort, cursor }) y storeSearch({ q, category, cursor }), 5 s y
  20 llamadas por minuto. Cada entrada lleva address (owner/repo, owner/repo/ruta, owner/repo@ref o url:https://...), id,
  name (de 1 a 60 caracteres) y, opcionales, description, categories, icon, popularity, updatedAt, signed/authorKey
  (solo pistas); "recommended" se ignora fuera de Kino Plugins. Máximo 5.000 entradas y 4 MB. Un plugin por id en todas
  las tiendas: si dos repositorios reclaman un id gana el de la lista de Kino Plugins y, si no, se conserva uno de forma
  determinista, y ninguna tienda puede listar el id kino-plugins. La tienda solo entrega direcciones: nunca instala nada
  ni dice que aprueba un plugin; Kino aplica su lista de bloqueo y el código +18, y muestra las líneas de consentimiento
  (una en rojo para una tienda en vivo). Quien publica un plugin responde por él; Kino solo lo lista. La vista de la
  tienda tiene las pestañas «De Kino» (la lista por defecto de Kino Plugins), «De la comunidad» (todo lo demás, de todas
  las tiendas) e «Instalados». Comprueba con node sdk/validate.mjs . y node sdk/run.mjs . storeSync (y storeList /
  storeSearch si es en vivo) sin nada reportado como [dropped by Kino]. identity: kino.identity.telegram({ challenge? })
  responde { id, token } solo a plugins firmados con la llave de autor de Kino y solo dentro de una llamada que la persona
  inició; nunca registres ni muestres el token; el plugin funciona si se rechaza (permission_denied). notifications:
  kino.notifications.post({ id, title, text?, go? }) y clear(id?), títulos de 80 caracteres, textos de 160, 20 avisos por
  hora, desde una pantalla o el trabajo. library: kino.library.watched() trae season y episode en las series. Todo
  declarativo y probado con node sdk/run.mjs . notifications y las variables KINO_IDENTITY_*.

Al final, llévame de la mano:
1. Publicarlo: repositorio público (nunca fork) con los archivos en la raíz; el topic kino-plugin y
   una descripción en GitHub (About → ⚙ → Description y Topics → Save changes, o
   `gh repo edit USUARIO/REPO --add-topic kino-plugin --description "…"`); y un "name" y una
   "description" buenos, en español, en kino-plugin.json, porque eso es lo que la gente ve en Kino.
2. Instalarlo en Kino: en el celular, menú ☰ → Plugins → botón +; en el televisor, Ajustes →
   Plugins → Agregar. Escribir USUARIO/REPO → Agregar → leer la hoja → Instalar (y Configurar si
   pide datos).
3. Qué probar a mano en Kino y qué hacer si algo falla.