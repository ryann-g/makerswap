import { auth } from './firebase';
import { logger } from './logger';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Handles Firestore errors by logging technical metadata and throwing 
 * a user-friendly error message. Prevents leaking internal state to UI.
 */
export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  // Log technical details for developers
  const technicalInfo = {
    code: error?.code,
    message: error?.message,
    operationType,
    path,
    uid: auth.currentUser?.uid
  };
  logger.error('[Firestore Error Details]:', technicalInfo);

  // Map Firebase error codes to friendly messages
  let userFriendlyMessage = "An unexpected database error occurred.";
  
  if (error?.code === 'permission-denied') {
    userFriendlyMessage = "Access denied. You may not have permission to perform this action or need to sign in.";
  } else if (error?.code === 'unavailable') {
    userFriendlyMessage = "The service is temporarily unavailable. Please check your internet connection.";
  } else if (error?.code === 'not-found') {
    userFriendlyMessage = "The requested item could not be found.";
  } else if (error?.code === 'failed-precondition') {
    userFriendlyMessage = "Query failed. This might require a database index update.";
  }

  throw new Error(userFriendlyMessage);
}
