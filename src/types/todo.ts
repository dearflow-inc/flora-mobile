export enum TodoState {
  DONE = "done",
  PENDING = "pending",
  DROPPED = "dropped",
}

export enum TodoSortBy {
  NEWEST = "newest",
  MOST_URGENT = "most_urgent",
  LATEST = "latest",
}

export interface SystemReference {
  id: string;
  type: string;
  externalId?: string;
}

export interface Author {
  type: string;
  externalId: string;
}

export interface Todo {
  id: string;
  title: string;
  deadline?: Date;
  context: SystemReference[];
  state: TodoState;
  dfOwner: Author;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTodoRequest {
  title: string;
  dueDate?: Date;
  context?: SystemReference[];
}

export interface UpdateTodoRequest {
  title?: string;
  dueDate?: Date;
  context?: SystemReference[];
  state?: TodoState;
}

export interface UpdateTodoStateRequest {
  state: TodoState;
}

export interface TodosResponse {
  todos: Todo[];
  total: number;
}
