"""CPU-intensive task with ProcessPoolExecutor - correct pattern."""
from concurrent.futures import ProcessPoolExecutor
from fastapi import APIRouter

router = APIRouter()
process_pool = ProcessPoolExecutor(max_workers=4)

def heavy_computation(n: int) -> int:
    """CPU-intensive computation."""
    return sum([x**2 for x in range(n)])

@router.post("/process-data")
async def process_data(n: int):
    # CORRECT: Run in separate process to bypass GIL
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        process_pool,
        heavy_computation,
        n
    )
    return {"result": result}
