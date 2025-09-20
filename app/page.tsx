"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Todo = { id: string; title: string; completed: boolean; posX: number; posY: number; posZ: number; pile: number };

function Sticky({ todo, onToggle }: { todo: Todo; onToggle: (id: string) => void }) {
  return (
    <group position={[todo.posX, todo.posY, todo.posZ]}>
      <mesh onClick={() => onToggle(todo.id)}>
        <boxGeometry args={[1.2, 0.06, 1.2]} />
        <meshStandardMaterial color={todo.completed ? "#86efac" : "#fde68a"} />
      </mesh>
    </group>
  );
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    fetch("/api/todos").then((r) => r.json()).then(setTodos).catch(() => {});
  }, []);

  function layoutPile(index: number, pile: number) {
    const x = pile * 1.6;
    const y = index * 0.08;
    const z = Math.sin(index) * 0.2;
    return { x, y, z };
  }

  const arranged = useMemo(() => {
    return todos.map((t, i) => {
      const pos = layoutPile(i, t.pile ?? 0);
      return { ...t, posX: pos.x, posY: pos.y, posZ: pos.z };
    });
  }, [todos]);

  async function addTodo() {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle }) });
    const created = await res.json();
    setTodos((prev) => [created, ...prev]);
    setNewTitle("");
  }

  async function toggle(id: string) {
    const t = todos.find((x) => x.id === id);
    if (!t) return;
    const res = await fetch(`/api/todos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !t.completed }) });
    const updated = await res.json();
    setTodos((prev) => prev.map((x) => (x.id === id ? updated : x)));
  }

  return (
    <div className="h-dvh w-dvw grid grid-rows-[auto_1fr]">
      <div className="p-3 flex gap-2 items-center">
        <Input placeholder="Add a todo..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <Button onClick={addTodo}>Add</Button>
        <div className="ml-auto">
          <form method="post" action="/api/auth/logout"><Button variant="ghost">Logout</Button></form>
        </div>
      </div>
      <Canvas camera={{ position: [4, 3, 6], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
        {arranged.map((t) => (
          <Sticky key={t.id} todo={t} onToggle={toggle} />
        ))}
        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={20} blur={2.5} far={15} />
        <OrbitControls enableDamping />
      </Canvas>
    </div>
  );
}
