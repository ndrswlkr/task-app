import mojo, {jsonConfigPlugin} from '@mojojs/core'
import mongodb from 'mongodb'
import {inject_db, all_tasks} from './dao/tasks_dao.js'
import {inject_db as userdata_inject_db, add_user, verify_user} from './dao/userdata.js'

const say = console.log
const app = mojo();
say(app.mode)
app.plugin(jsonConfigPlugin, {file: 'conf/app.conf'});


async function db_connect() {
	let dbUrl = app.config.dbUrl
	if(app.mode === 'production'){
		dbUrl = app.config.dbUrlProduction
	} 
	const client = new mongodb.MongoClient(dbUrl)
	await client.connect()
	await inject_db(client.db())
	await userdata_inject_db(client.db())
	return client.db()
}

const authorized = app.under( '/', async ctx=> {
	const session = await ctx.session()
	say("checking user:", session.email)
	if (session.email === undefined){
		ctx.flash.message = "not logged in"
		await ctx.redirectTo('/login')
	}
	
})

// Render template "views/index.html.njk"
authorized.get('/tasks', async ctx => {
	const data = await all_tasks();
  await ctx.render({view: 'main'},{
  	message: 'this could be good', 
  	secret: 'lalabaloosa',
  	title: 'tasks',
  	tasks: data,
  });
});

authorized.post('/tasks', async ctx => {
	const params = await ctx.params()
	say(ctx.inspect(params))
	const [task, urgency, done] = [params.get('task'), params.get('urgency'), params.get('done') ? true : false]
	say ( task, urgency, done)
	await ctx.redirectTo('/tasks')
})

app.get( '/', c => {
	c.stash.one = c.config.app_name
	c.render({inline: simple_template}, { two: c.config.author})
}) 

app.get('register', c => {
	c.render({view: 'register'}, {title: 'register'})
})

app.post('register', async c => {
	await add_user(c)
})

app.get('login', c => {
	c.render({view: 'login'}, {title: 'login'})
})

app.post('login', async c => {
	const logged_in = await verify_user(c)
	if(logged_in === false){
		say("verify_user returned false")
		c.redirectTo('/login')
	}
	c.redirectTo('/tasks')
})

async function main() {
	const db = await db_connect()
	app.start()	
}

main().catch( e => say(e))


const simple_template = `
<h2> <%= "Task App" %> </h2>
<h3> <%= "by ndrs wlkr" %>  </h3>
` 