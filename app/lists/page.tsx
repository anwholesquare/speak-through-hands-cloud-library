"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Text, Billboard } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ListType = {
  id: string;
  title: string;
  posX: number;
  posZ: number;
  localOnly?: boolean;
  dirty?: boolean;
  deleted?: boolean;
};

type ItemType = {
  id: string;
  listId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  localOnly?: boolean;
  dirty?: boolean;
  deleted?: boolean;
};

function ListBar({ list, index, isSelected, onSelect }: { list: ListType; index: number; isSelected: boolean; onSelect: (id: string) => void }) {
  const baseWidth = 0.8;
  const width = baseWidth + Math.min(2.0, list.title.length * 0.08);
  const height = 0.4;
  const depth = 0.6;
  const x = list.posX ?? index * 2.2;
  const z = list.posZ ?? 0;
  return (
    <group position={[x, 0, z]}>
      <mesh onClick={() => onSelect(list.id)}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={isSelected ? "#93c5fd" : "#a7f3d0"} />
      </mesh>
      <Billboard follow position={[0, height * 0.8, 0]}>
        <Text color="#111" anchorX="center" anchorY="middle" maxWidth={width * 1.3} fontSize={0.22}>
          {list.title}
        </Text>
      </Billboard>
    </group>
  );
}

function ItemCard({ x, z, index, item, onToggle, onEdit }: { x: number; z: number; index: number; item: ItemType; onToggle: (id: string) => void; onEdit: (id: string) => void }) {
  const width = 1.2;
  const height = 0.06;
  const depth = 1.0;
  const y = 0.6 + index * 0.3;
  return (
    <group position={[x, y, z]}>
      <mesh onClick={() => onToggle(item.id)} onDoubleClick={() => onEdit(item.id)}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={item.completed ? "#86efac" : "#fde68a"} />
      </mesh>
      <Billboard follow position={[0, 0.2, 0]}>
        <Text color="#111" anchorX="center" anchorY="middle" maxWidth={width * 0.9} fontSize={0.16}>
          {item.title}
        </Text>
      </Billboard>
    </group>
  );
}

export default function ListsPage() {
  const [lists, setLists] = useState<ListType[]>([]);
  const [itemsByList, setItemsByList] = useState<Record<string, ItemType[]>>({});
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newListTitle, setNewListTitle] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editItemId, setEditItemId] = useState<string | null>(null);

  // Local-first then seed from server
  useEffect(() => {
    try {
      const rawLists = localStorage.getItem("tudu3.lists");
      const rawItems = localStorage.getItem("tudu3.items");
      if (rawLists) setLists(JSON.parse(rawLists));
      if (rawItems) setItemsByList(JSON.parse(rawItems));
      if (rawLists) return;
    } catch {}
    fetch("/api/lists").then((r) => r.json()).then((serverLists: ListType[]) => {
      setLists(serverLists);
      if (serverLists[0]?.id) {
        fetch(`/api/items?listId=${serverLists[0].id}`).then((r) => r.json()).then((items: ItemType[]) => setItemsByList((m) => ({ ...m, [serverLists[0].id]: items })) ).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => { try { localStorage.setItem("tudu3.lists", JSON.stringify(lists)); } catch {} }, [lists]);
  useEffect(() => { try { localStorage.setItem("tudu3.items", JSON.stringify(itemsByList)); } catch {} }, [itemsByList]);

  const arrangedLists = useMemo(() => lists.filter((l) => !l.deleted).map((l, i) => ({ ...l, posX: l.posX ?? i * 2.2, posZ: l.posZ ?? 0 })), [lists]);
  const selectedList = arrangedLists.find((l) => l.id === selectedListId) || null;
  const selectedItems = useMemo(() => {
    if (!selectedListId) return [] as ItemType[];
    return (itemsByList[selectedListId] || []).filter((it) => !it.deleted).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [itemsByList, selectedListId]);

  // Actions
  function addList() {
    const title = newListTitle.trim();
    if (!title) return;
    const id = `local-${uuidv4()}`;
    const list: ListType = { id, title, posX: arrangedLists.length * 2.2, posZ: 0, localOnly: true, dirty: true };
    setLists((prev) => [...prev, list]);
    setNewListTitle("");
  }

  function addItem() {
    if (!selectedListId) return;
    const title = newItemTitle.trim();
    if (!title) return;
    const id = `local-${uuidv4()}`;
    const listItems = itemsByList[selectedListId] || [];
    const sortOrder = (listItems[listItems.length - 1]?.sortOrder ?? 0) + 1;
    const item: ItemType = { id, listId: selectedListId, title, completed: false, sortOrder, localOnly: true, dirty: true };
    setItemsByList((m) => ({ ...m, [selectedListId]: [...listItems, item] }));
    setNewItemTitle("");
  }
  function toggleItem(id: string) { if (!selectedListId) return; setItemsByList((m) => ({ ...m, [selectedListId]: (m[selectedListId] || []).map((it) => (it.id === id ? { ...it, completed: !it.completed, dirty: true } : it)) })); }
  function updateItemTitle(id: string, title: string) { if (!selectedListId) return; setItemsByList((m) => ({ ...m, [selectedListId]: (m[selectedListId] || []).map((it) => (it.id === id ? { ...it, title, dirty: true } : it)) })); }
  function deleteItem(id: string) { if (!selectedListId) return; setItemsByList((m) => ({ ...m, [selectedListId]: (m[selectedListId] || []).map((it) => (it.id === id ? { ...it, deleted: true, dirty: true } : it)) })); setEditItemId(null); }

  function unsyncedCount() {
    const listCount = lists.filter((l) => l.localOnly || l.dirty || l.deleted).length;
    const itemCount = Object.values(itemsByList).flat().filter((it) => it.localOnly || it.dirty || it.deleted).length;
    return listCount + itemCount;
  }

  async function syncAll() {
    // lists
    for (const l of [...lists]) {
      if (l.deleted && l.localOnly) { setLists((prev) => prev.filter((x) => x.id !== l.id)); continue; }
      if (l.localOnly && !l.deleted) {
        try {
          const res = await fetch("/api/lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: l.title }) });
          if (res.ok) {
            const created: ListType = await res.json();
            setItemsByList((m) => { const copy = { ...m } as Record<string, ItemType[]>; if (copy[l.id]) { const moved = copy[l.id].map((it) => ({ ...it, listId: created.id })); delete copy[l.id]; copy[created.id] = moved; } return copy; });
            setLists((prev) => prev.map((x) => (x.id === l.id ? { ...created, dirty: false, localOnly: false } : x)));
          }
        } catch {}
      } else if (!l.localOnly && l.deleted) {
        try { await fetch(`/api/lists/${l.id}`, { method: "DELETE" }); } catch {}
        setLists((prev) => prev.filter((x) => x.id !== l.id));
      } else if (!l.localOnly && l.dirty) {
        try {
          const res = await fetch(`/api/lists/${l.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: l.title, posX: l.posX, posZ: l.posZ }) });
          if (res.ok) { const updated: ListType = await res.json(); setLists((prev) => prev.map((x) => (x.id === l.id ? { ...updated, dirty: false } : x))); }
        } catch {}
      }
    }
    // items
    for (const [listId, items] of Object.entries(itemsByList)) {
      const parentIsLocal = lists.find((l) => l.id === listId)?.localOnly;
      for (const it of [...items]) {
        if (it.deleted && it.localOnly) { setItemsByList((m) => ({ ...m, [listId]: (m[listId] || []).filter((x) => x.id !== it.id) })); continue; }
        if ((it.localOnly && !it.deleted) && !parentIsLocal) {
          try {
            const res = await fetch("/api/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: it.title, listId }) });
            if (res.ok) {
              const created: ItemType = await res.json();
              setItemsByList((m) => ({ ...m, [listId]: (m[listId] || []).map((x) => (x.id === it.id ? { ...created, dirty: false, localOnly: false } : x)) }));
            }
          } catch {}
        } else if (!it.localOnly && it.deleted) {
          try { await fetch(`/api/items/${it.id}`, { method: "DELETE" }); } catch {}
          setItemsByList((m) => ({ ...m, [listId]: (m[listId] || []).filter((x) => x.id !== it.id) }));
        } else if (!it.localOnly && it.dirty) {
          try {
            const res = await fetch(`/api/items/${it.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: it.title, completed: it.completed, sortOrder: it.sortOrder }) });
            if (res.ok) { const updated: ItemType = await res.json(); setItemsByList((m) => ({ ...m, [listId]: (m[listId] || []).map((x) => (x.id === it.id ? { ...updated, dirty: false } : x)) })); }
          } catch {}
        }
      }
    }
  }

  return (
    <div className="h-dvh w-dvw grid grid-rows-[auto_1fr]">
      <div className="p-3 flex gap-2 items-center flex-wrap">
        <Input placeholder="New list title" value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} className="w-[240px]" />
        <Button onClick={addList}>Add List</Button>
        {selectedList && (
          <>
            <Input placeholder="New item title" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} className="w-[240px]" />
            <Button onClick={addItem} disabled={!newItemTitle.trim()}>Add Item</Button>
          </>
        )}
        <Button variant="secondary" onClick={syncAll} disabled={unsyncedCount() === 0}>Save ({unsyncedCount()})</Button>
        <div className="ml-auto">
          <form method="post" action="/api/auth/logout"><Button variant="ghost">Logout</Button></form>
        </div>
      </div>
      <Canvas camera={{ position: [4, 3, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
        {arrangedLists.map((l, i) => (
          <ListBar key={l.id} list={l} index={i} isSelected={selectedListId === l.id} onSelect={setSelectedListId} />
        ))}
        {selectedList && selectedItems.map((it, i) => (
          <ItemCard key={it.id} x={selectedList.posX ?? 0} z={(selectedList.posZ ?? 0) + 1.0} index={i} item={it} onToggle={(id) => toggleItem(id)} onEdit={setEditItemId} />
        ))}
        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={40} blur={2.5} far={25} />
        <OrbitControls enableDamping />
      </Canvas>

      <Dialog open={!!editItemId} onOpenChange={(o) => !o && setEditItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {selectedListId && editItemId && (
            <div className="space-y-3">
              <Input
                value={(itemsByList[selectedListId] || []).find((x) => x.id === editItemId)?.title || ""}
                onChange={(e) => updateItemTitle(editItemId, e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="destructive" onClick={() => deleteItem(editItemId)}>Delete</Button>
                <Button variant="secondary" onClick={() => setEditItemId(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


