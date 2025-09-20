"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Text, Billboard } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Todo = { id: string; title: string; completed: boolean; posX: number; posY: number; posZ: number; pile: number; localOnly?: boolean; dirty?: boolean; deleted?: boolean };

function Sticky({ todo, onToggle, onSelect }: { todo: Todo; onToggle: (id: string) => void; onSelect: (id: string) => void }) {
  return (
    <group position={[todo.posX, todo.posY, todo.posZ]}>
      <mesh onDoubleClick={() => onSelect(todo.id)} onClick={() => onToggle(todo.id)}>
        <boxGeometry args={[1.2, 0.06, 1.2]} />
        <meshStandardMaterial color={todo.completed ? "#86efac" : "#fde68a"} />
      </mesh>
      <Billboard follow position={[0, 0.2, 0]}>
        <Text color="#111" anchorX="center" anchorY="middle" maxWidth={1.1} fontSize={0.18}>
          {todo.title}
        </Text>
      </Billboard>
    </group>
  );
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = todos.find((t) => t.id === selectedId) || null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tudu3.todos");
      if (raw) {
        setTodos(JSON.parse(raw));
        return;
      }
    } catch {}
    fetch("/api/todos").then((r) => r.json()).then(setTodos).catch(() => {});
  }, []);

  useEffect(() => {
    try { localStorage.setItem("tudu3.todos", JSON.stringify(todos)); } catch {}
  }, [todos]);

  function layoutPile(index: number, pile: number) {
    const x = pile * 1.6;
    const y = index * 0.08;
    const z = Math.sin(index) * 0.2;
    return { x, y, z };
  }

  const arranged = useMemo(() => {
    return todos.filter((t) => !t.deleted).map((t, i) => {
      const pos = layoutPile(i, t.pile ?? 0);
      return { ...t, posX: pos.x, posY: pos.y, posZ: pos.z };
    });
  }, [todos]);

  function addTodo() {
    if (!newTitle.trim()) return;
    const id = `local-${uuidv4()}`;
    const draft: Todo = { id, title: newTitle.trim(), completed: false, pile: 0, posX: 0, posY: 0, posZ: 0, localOnly: true, dirty: true };
    setTodos((prev) => [draft, ...prev]);
    setNewTitle("");
  }

  function toggle(id: string) {
    setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, completed: !x.completed, dirty: true } : x)));
  }

  function updateTitle(id: string, title: string) {
    setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, title, dirty: true } : x)));
  }

  function remove(id: string) {
    setTodos((prev) => prev.map((x) => (x.id === id ? { ...x, deleted: true, dirty: true } : x)));
    setSelectedId(null);
  }

  function unsyncedCount() {
    return todos.filter((t) => t.localOnly || t.dirty || t.deleted).length;
  }

  async function syncTodos() {
    // create local-only
    for (const t of [...todos]) {
      if (t.deleted && t.localOnly) {
        setTodos((prev) => prev.filter((x) => x.id !== t.id));
        continue;
      }
      if (t.localOnly && !t.deleted) {
        try {
          const res = await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t.title }) });
          if (res.ok) {
            const created = await res.json();
            setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...created, dirty: false, localOnly: false } : x)));
          }
        } catch {}
      }
    }
    // update/delete server-backed
    for (const t of [...todos]) {
      if (!t.localOnly && t.deleted) {
        try { await fetch(`/api/todos/${t.id}`, { method: "DELETE" }); } catch {}
        setTodos((prev) => prev.filter((x) => x.id !== t.id));
      } else if (!t.localOnly && t.dirty) {
        try {
          const res = await fetch(`/api/todos/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t.title, completed: t.completed }) });
          if (res.ok) {
            const updated = await res.json();
            setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...updated, dirty: false } : x)));
          }
        } catch {}
      }
    }
  }

  return (
    <div className="h-dvh w-dvw grid grid-rows-[auto_1fr]">
      <div className="p-3 flex gap-2 items-center">
        <Input placeholder="Add a todo..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <Button onClick={addTodo}>Add</Button>
        <Button variant="secondary" onClick={syncTodos} disabled={unsyncedCount() === 0}>Save ({unsyncedCount()})</Button>
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
          <Sticky key={t.id} todo={t} onToggle={toggle} onSelect={setSelectedId} />
        ))}
        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={20} blur={2.5} far={15} />
        <OrbitControls enableDamping />
      </Canvas>
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Todo</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <Input value={selected.title} onChange={(e) => updateTitle(selected.id, e.target.value)} />
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => remove(selected.id)}>Delete</Button>
                <Button variant="secondary" onClick={() => setSelectedId(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
