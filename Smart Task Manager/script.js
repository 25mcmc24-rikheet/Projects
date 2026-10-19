
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let filter = "all";

document.getElementById("dueDate").min = new Date().toLocaleDateString("en-CA");

function addTask() {
    let text = document.getElementById("taskInput").value.trim();
    let date = document.getElementById("dueDate").value;

    if (text === "") {
        alert("Please enter a task!");
        return;
    }

    tasks.push({
        text: text,
        date: date,
        completed: false
    });

    document.getElementById("taskInput").value = "";
    showTasks();
}

function showTasks() {
    let list = document.getElementById("taskList");
    list.innerHTML = "";

    let filtered = tasks
        .map((task, index) => ({ ...task, index }))
        .filter(task =>
            filter === "all" ||
            (filter === "completed" && task.completed) ||
            (filter === "pending" && !task.completed)
        )
        .sort((a, b) =>
            (a.date || "9999-99-99").localeCompare(
                b.date || "9999-99-99"
            )
        );

    filtered.forEach(task => {
        let li = document.createElement("li");

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        checkbox.onchange = () => {
            tasks[task.index].completed = checkbox.checked;
            showTasks();
        };

        let text = document.createElement("span");
        text.textContent = ` ${task.text} (${task.date || "No date"})`;

        if (task.completed) text.className = "completed";

        let del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = () => {
            tasks.splice(task.index, 1);
            showTasks();
        };

        li.append(checkbox, text, del);
        list.appendChild(li);
    });

    let completed = tasks.filter(t => t.completed).length;

    document.getElementById("counts").textContent =
        `Total: ${tasks.length} | Pending: ${tasks.length - completed} | Completed: ${completed}`;
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function filterTasks(type) {
    filter = type;
    showTasks();
}

showTasks();
