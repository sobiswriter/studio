
import { db } from '../lib/firebase'; // This path should resolve to src/lib/firebase.ts
import type { Task, UserProfile } from '../types'; // This path should resolve to src/types/index.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  getDoc,
  query,
  orderBy,
  deleteField,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';

// Helper to transform snapshot data
const transformSnapshot = <T extends { id: string }>(
  snapshot: QueryDocumentSnapshot<DocumentData>
): T => {
  const data = snapshot.data();
  // Ensure timestamps are converted if they exist
  if (data.createdAt && typeof data.createdAt.toDate === 'function') {
    data.createdAt = data.createdAt.toDate().getTime();
  }
  if (data.startTime && typeof data.startTime.toDate === 'function') {
    data.startTime = data.startTime.toDate().getTime();
  }
  return {
    id: snapshot.id,
    ...data,
  } as T;
};


// --- User Profile Functions ---
export const onUserProfileSnapshot = (
  userId: string,
  callback: (profile: UserProfile | null) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const profileRef = doc(db, 'users', userId);
  return onSnapshot(profileRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    } else {
      callback(null);
    }
  }, onError);
};

export const createUserProfileInDB = async (userId: string, profileData: UserProfile): Promise<boolean> => {
  const profileRef = doc(db, 'users', userId);
  try {
    await setDoc(profileRef, profileData);
    return true;
  } catch (error) {
    console.error("Error creating user profile in DB:", error);
    return false;
  }
};

export const updateUserProfileData = async (userId: string, dataToUpdate: Partial<UserProfile>): Promise<boolean> => {
  const profileRef = doc(db, 'users', userId);
  const dbData: { [key: string]: any } = { ...dataToUpdate };
  if (dataToUpdate.pixelSpriteCosmetics === undefined && 'pixelSpriteCosmetics' in dataToUpdate) {
    dbData.pixelSpriteCosmetics = deleteField();
  }
  // Add similar checks for other potentially undefined fields if necessary

  try {
    await updateDoc(profileRef, dbData);
    return true;
  } catch (error) {
    console.error("Error updating user profile in DB:", error);
    return false;
  }
};

// --- Task Functions ---
export const onTasksSnapshot = (
  userId: string,
  callback: (tasks: Task[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const tasksCollectionRef = collection(db, 'users', userId, 'tasks');
  const q = query(tasksCollectionRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map(docSnap => transformSnapshot<Task>(docSnap));
    callback(tasks);
  }, onError);
};

export const addTaskToDB = async (userId: string, taskData: Omit<Task, 'id'>): Promise<Task | null> => {
  try {
    const docData: { [key: string]: any } = {
        ...taskData,
        createdAt: taskData.createdAt || Date.now(),
        isStarted: taskData.isStarted === undefined ? false : taskData.isStarted,
    };

    const optionalFields: (keyof Omit<Task, 'id' | 'title' | 'isCompleted' | 'createdAt' | 'isStarted'>)[] = ['duration', 'dueDate', 'startTime', 'xp'];
    optionalFields.forEach(field => {
      if (taskData[field] !== undefined) {
        docData[field] = taskData[field];
      }
    });


    const docRef = await addDoc(collection(db, 'users', userId, 'tasks'), docData);
    const addedTaskData = (await getDoc(docRef)).data(); // Fetch the data to ensure all server-side transforms (like timestamps) are included
     if (!addedTaskData) {
      throw new Error('Failed to fetch added task data from DB');
    }
    return { id: docRef.id, ...transformSnapshot<Omit<Task, 'id'>>({ id: docRef.id, ...addedTaskData } as any) } as Task;
  } catch (error) {
    console.error("Error adding task to DB:", error);
    return null;
  }
};


export const updateTaskInDB = async (userId: string, taskId: string, dataToUpdate: Partial<Task>): Promise<boolean> => {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  const dbData: { [key: string]: any } = { ...dataToUpdate };

  const optionalFields: (keyof Task)[] = ['duration', 'dueDate', 'startTime', 'timerId', 'xp', 'isStarted'];
  optionalFields.forEach(field => {
    if (field in dataToUpdate && dataToUpdate[field] === undefined) {
      dbData[field] = deleteField();
    }
  });
   if ('isCompleted' in dataToUpdate && dataToUpdate.isCompleted === false) {
    dbData.isCompleted = false; // Ensure false is set correctly, not deleted
  }


  try {
    await updateDoc(taskRef, dbData);
    return true;
  } catch (error) {
    console.error("Error updating task in DB:", error, "Data sent:", dbData);
    return false;
  }
};

export const deleteTaskFromDB = async (userId: string, taskId: string): Promise<boolean> => {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  try {
    await deleteDoc(taskRef);
    return true;
  } catch (error) {
    console.error("Error deleting task from DB:", error);
    return false;
  }
};
