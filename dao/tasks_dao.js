let db;
let tasks;

export async function inject_db(_db){
	db = _db
	tasks = await db.collection('tasks')
}

export async function all_tasks(){
	const data = await tasks.find().toArray()
	return data
}