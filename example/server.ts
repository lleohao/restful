import { addParser, Parser, Restful } from '../lib/index';

const api = new Restful();

interface TodoItem {
    id: number,
    title: string;
    completed: boolean;
}

let TODOS: TodoItem[] = [{
    id: 0,
    title: 'init todo',
    completed: false
}];
let COUNT_ID = 0;

let parser = new Parser();
parser.addParam('title', {
    required: true,
    type: 'string'
})


/**
 * 
 * 
 * @param {number} todoId
 */
let indexOf = function (todoId: number) {
    let index, len = TODOS.length;
    for (index = 0; index < len; index++) {
        if (TODOS[index].id === todoId) {
            break;
        }
    }

    if (index === len) {
        return -1;
    } else {
        return index;
    }
}


class Todo {
    get({todoId}) {
        todoId = parseInt(todoId);
        let item = TODOS.filter((item) => {
            return item.id === todoId;
        })

        if (item.length === 0) {
            return `The item for the id:${todoId} does not exist`
        } else {
            return item[0];
        }
    }

    delete({todoId}) {
        todoId = parseInt(todoId);
        let index = indexOf(todoId);

        if (index === -1) {
            return `The item for the id:${todoId} does not exist`
        } else {
            TODOS.splice(index, 1);
            return 'success';
        }
    }

    put({todoId}) {
        todoId = parseInt(todoId);
        let index = indexOf(todoId);

        if (index === -1) {
            return `The item for the id:${todoId} does not exist`
        } else {
            TODOS[index].completed = !TODOS[index].completed;
            return 'success';
        }
    }
}

class TodoList {
    get() {
        return TODOS;
    }


    @addParser(parser)
    post({title}) {
        let item = {
            id: ++COUNT_ID,
            title: title,
            completed: false

        }
        TODOS.push(item);
        return item;
    }
}

api.addSource(TodoList, '/todos')
api.addSource(Todo, '/todos/<todoId>')

api.start();