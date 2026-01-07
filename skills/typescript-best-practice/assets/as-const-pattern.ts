// ============================================
// Pattern: as const instead of enum
// ============================================

// 1. Define object with 'as const'
const Status = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed'
} as const;

// 2. Extract the type
type StatusType = (typeof Status)[keyof typeof Status];

// 3. Use like enum
function updateStatus(status: StatusType) {
    if (status === Status.PENDING) {
        console.log('Status is pending...');
    }
    console.log(`Status updated to: ${status}`);
}
