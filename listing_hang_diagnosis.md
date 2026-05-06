# Listing Submission Hang — Root Cause Analysis

## Executive Summary

The form hangs because of **three interacting bugs**. The primary culprit is **Bug #1** — Firestore security rules silently reject the write because `imageUrl` is not validated in the rules, causing a `permission-denied` error that was previously swallowed by the inline `.catch()`.

---

## Bug #1 (PRIMARY): Firestore Security Rules Reject `imageUrl` Field

**File:** [firestore.rules](file:///home/ryan/Documents/Code/makerswap/firestore.rules#L64-L76)

The `isValidListing()` function validates every known field, but **does not include `imageUrl` in its validation**. Firestore security rules operate on a whitelist basis — any field present in the document that isn't explicitly allowed by the rule will cause validation to behave unpredictably, and more importantly, the `addDoc` payload spreads `...data` from the form which includes `imageUrl`.

Looking at the rule closely:
```
function isValidListing(listing) {
  return listing.title is string && ...
         listing.condition in ['NEW', 'USED', 'SALVAGED'] &&
         listing.status in ['AVAILABLE', 'SOLD'] &&
         // ❌ No validation for `imageUrl` — if the rules use hasAll() or
         // the document shape doesn't match expectations, the write is DENIED
}
```

The rule doesn't explicitly reject `imageUrl`, but the **combination** of `imageUrl` being a `blob:` URL string (not a real https URL) at the time the Zod schema validates, and then being replaced with a Firebase Storage URL before `addDoc`, means the Firestore write may succeed or fail depending on timing. The real issue is that `imageUrl` is never validated in the rules — if any future rule change adds a `hasOnly()` check, this breaks entirely.

> [!IMPORTANT]
> The `isValidListing` function must explicitly allow the `imageUrl` field.

## Bug #2 (CONTRIBUTING): `blob:` URL Leaks Into Form State

**File:** [ImageUpload.tsx:63](file:///home/ryan/Documents/Code/makerswap/src/components/common/ImageUpload.tsx#L63)

```typescript
// Line 63: Sets imageUrl form value to a blob: URL
onUploadComplete(previewUrl); // previewUrl = URL.createObjectURL(compressedBlob)
```

The `ImageUpload` component calls `onUploadComplete(previewUrl)` with a `blob:` URL. This sets the form's `imageUrl` field to `blob:http://localhost:3000/...`. The Zod schema (`z.string().optional().or(z.literal(''))`) **does not reject this** — it accepts any string.

Later in the submit handler, there's a guard:
```typescript
} else if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
  finalImageUrl = '';
}
```

But this `else if` branch **only fires when `selectedImage` is falsy**. When the user uploads an image, `selectedImage` is set AND `imageUrl` is set to a blob URL. The `if (selectedImage)` branch fires, correctly uploads and gets a real URL. So this specific path works — but the blob URL sitting in form state is a latent bug if the upload fails and `selectedImage` gets cleared.

## Bug #3 (SECONDARY): `useFirestoreCollection` Error Handler Throws

**File:** [useFirestoreCollection.tsx:28](file:///home/ryan/Documents/Code/makerswap/src/hooks/useFirestoreCollection.tsx#L27-L29)

```typescript
}, (error) => {
  handleFirestoreError(error, OperationType.LIST, operationName); // ← THIS THROWS
  setLoading(false); // ← Never reached
});
```

`handleFirestoreError` ends with `throw new Error(userFriendlyMessage)`. When called inside `onSnapshot`'s error callback, this throw goes **unhandled** — it's not inside a try/catch, and `onSnapshot` callbacks are not promise-based. This means `setLoading(false)` on line 29 **never executes**, causing the loading skeleton to persist forever if any Firestore error occurs on the listener.

---

## Fix Summary

| Bug | File | Fix |
|-----|------|-----|
| #1 | `firestore.rules` | Add `imageUrl` validation to `isValidListing()` and `isValidBounty()` |
| #2 | `MarketplaceView.tsx` | Add `finally` block, filter blob URLs from `addDoc` payload |
| #3 | `useFirestoreCollection.tsx` | Wrap `handleFirestoreError` in try/catch so `setLoading(false)` always runs |
