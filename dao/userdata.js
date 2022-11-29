import bcrypt from 'bcrypt'
const say = console.log

let db
let userdata

export async function inject_db(_db){
	db = _db
	userdata = await db.collection('userdata')
	return userdata
}

export async function add_user(ctx) {

  const params = await ctx.params();  // data was passed to method via form post
  const email = params.get('email')
  const results = await userdata.findOne({email: email} );
  say(results)
  if (results) {
  	await ctx.render({text: 'user allready exists'})
  	return
  }
  else {
  	try{
  		const hash = await bcrypt.hash(params.get('password'), 12);
  		say(hash)
  		const result = await userdata.insertOne({
  			email: email,
  			password: hash
  		})
  		say("db says", result)
  		const session = await ctx.session()
  		session.expiration = 10
  		session.email = email

  		say(session)

      await ctx.redirectTo('tasks');
  	}
  	catch(e){
  		await ctx.render({text: 'something went wrong' + e})
  	}
  }
}

export async function verify_user(ctx){
	const params = await ctx.params()
	const email = params.get('email')
	const password = params.get('password')
	if(email === undefined){
		await ctx.redirectTo('/register')
	}
	const user = await userdata.findOne({email: email})
	if( user === null ) {
		ctx.flash.message = "wrong username or password"
		await ctx.redirectTo('/login')
	}
	    if (await bcrypt.compare(password, user.password)) {
      	// password match
				const session = await ctx.session()
				session.expiration = 20
				session.email = email
				return true
    } else {
      // password did not match
      	ctx.flash.message = 'wrong password or password'
      	await ctx.redirectTo('/login');
    }
}