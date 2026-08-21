from fastapi import APIRouter, HTTPException
from database import db
from decimal import Decimal
from datetime import date
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================
# GET ALL EXPENSES
# GET /api/expenses/
# ============================================================
@router.get("/")
def get_expenses():
    try:
        cursor = db.get_cursor()

        if not cursor:
            raise HTTPException(
                status_code=500,
                detail="Database connection unavailable"
            )

        query = """
            SELECT
                e.expense_id,
                e.challan_id,
                e.category,
                e.amount,
                e.expense_date,
                e.payment_method,
                e.vendor,
                e.description,
                e.receipt_number,
                e.created_at,
                c.challan_no,
                c.driver_id,
                c.vehicle_id
            FROM expenses e
            LEFT JOIN challans c
                ON e.challan_id = c.id
            ORDER BY e.expense_id DESC
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        expenses = []

        for row in rows:
            expenses.append({
                "expense_id": row.expense_id,
                "id": row.expense_id,

                "challan_id": row.challan_id,
                "challanId": row.challan_id,
                "challan_no": row.challan_no,

                "category": row.category,

                "amount": float(row.amount or 0),

                "expense_date": (
                    row.expense_date.isoformat()
                    if row.expense_date
                    else None
                ),
                "date": (
                    row.expense_date.isoformat()
                    if row.expense_date
                    else None
                ),

                "payment_method": row.payment_method,
                "paymentMethod": row.payment_method,

                "vendor": row.vendor,
                "description": row.description,

                "receipt_number": row.receipt_number,
                "receiptNumber": row.receipt_number,

                "driver_id": row.driver_id,
                "vehicle_id": row.vehicle_id,

                "created_at": (
                    row.created_at.isoformat()
                    if row.created_at
                    else None
                )
            })

        return {
            "success": True,
            "count": len(expenses),
            "data": expenses
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Error fetching expenses")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch expenses: {str(e)}"
        )


# ============================================================
# GET SINGLE EXPENSE
# GET /api/expenses/{expense_id}
# ============================================================
@router.get("/{expense_id}")
def get_expense(expense_id: int):
    try:
        cursor = db.get_cursor()

        if not cursor:
            raise HTTPException(
                status_code=500,
                detail="Database connection unavailable"
            )

        query = """
            SELECT
                e.expense_id,
                e.challan_id,
                e.category,
                e.amount,
                e.expense_date,
                e.payment_method,
                e.vendor,
                e.description,
                e.receipt_number,
                e.created_at,
                c.challan_no
            FROM expenses e
            LEFT JOIN challans c
                ON e.challan_id = c.id
            WHERE e.expense_id = ?
        """

        cursor.execute(query, (expense_id,))
        row = cursor.fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        expense = {
            "expense_id": row.expense_id,
            "id": row.expense_id,

            "challan_id": row.challan_id,
            "challanId": row.challan_id,
            "challan_no": row.challan_no,

            "category": row.category,
            "amount": float(row.amount or 0),

            "expense_date": (
                row.expense_date.isoformat()
                if row.expense_date
                else None
            ),
            "date": (
                row.expense_date.isoformat()
                if row.expense_date
                else None
            ),

            "payment_method": row.payment_method,
            "paymentMethod": row.payment_method,

            "vendor": row.vendor,
            "description": row.description,

            "receipt_number": row.receipt_number,
            "receiptNumber": row.receipt_number,

            "created_at": (
                row.created_at.isoformat()
                if row.created_at
                else None
            )
        }

        return {
            "success": True,
            "data": expense
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Error fetching expense")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch expense: {str(e)}"
        )


# ============================================================
# CREATE EXPENSE
# POST /api/expenses/
# ============================================================
@router.post("/")
def create_expense(expense: dict):
    try:
        print("=" * 60)
        print("🔍 CREATE EXPENSE - Request received")
        print(f"  Request data: {expense}")
        
        cursor = db.get_cursor()

        if not cursor:
            print("❌ No database cursor")
            raise HTTPException(
                status_code=500,
                detail="Database connection unavailable"
            )

        # Support BOTH camelCase and snake_case
        challan_id = (
            expense.get("challanId")
            or expense.get("challan_id")
        )

        category = expense.get("category")
        amount = expense.get("amount")

        expense_date = (
            expense.get("date")
            or expense.get("expense_date")
            or date.today().isoformat()
        )

        payment_method = (
            expense.get("paymentMethod")
            or expense.get("payment_method")
            or "cash"
        )

        vendor = expense.get("vendor")
        description = expense.get("description")

        receipt_number = (
            expense.get("receiptNumber")
            or expense.get("receipt_number")
        )

        print(f"  Parsed - challan_id: {challan_id}, category: {category}, amount: {amount}")

        # Required validation
        if not challan_id:
            raise HTTPException(
                status_code=400,
                detail="Challan ID is required"
            )

        if not category:
            raise HTTPException(
                status_code=400,
                detail="Category is required"
            )

        if amount is None or amount == "":
            raise HTTPException(
                status_code=400,
                detail="Amount is required"
            )

        try:
            # ✅ FIX: quantize to exactly 2 decimal places so the Decimal's
            # own scale always matches the `amount DECIMAL(12,2)` column.
            # Without this, a whole-number amount (e.g. 22003) becomes
            # Decimal('22003') with scale 0. pyodbc infers the SQL
            # parameter's precision/scale from the Decimal object itself
            # rather than from the target column, so the driver sends a
            # scale-0 parameter into a scale-2 column and SQL Server
            # raises "Arithmetic overflow error converting numeric to
            # data type numeric" (SQLSTATE 22003) even though the value
            # fits comfortably within DECIMAL(12,2).
            amount = Decimal(str(amount)).quantize(Decimal("0.01"))

            if amount < 0:
                raise HTTPException(
                    status_code=400,
                    detail="Amount cannot be negative"
                )

            if amount > Decimal("9999999999.99"):
                raise HTTPException(
                    status_code=400,
                    detail="Amount is too large"
                )

            print(f"  Amount parsed: {amount}")
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Amount parsing error: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid amount: {str(e)}"
            )

        # Convert challan number -> challan_id (which is actually challans.id)
        try:
            challan_id_int = int(challan_id)
            print(f"  challan_id is integer: {challan_id_int}")
        except (ValueError, TypeError):
            print(f"  challan_id is string, looking up in database: {challan_id}")
            cursor.execute(
                """
                SELECT id
                FROM challans
                WHERE challan_no = ?
                """,
                (str(challan_id),)
            )
            challan_row = cursor.fetchone()
            if not challan_row:
                print(f"❌ Challan '{challan_id}' not found")
                raise HTTPException(
                    status_code=404,
                    detail=f"Challan '{challan_id}' not found"
                )
            challan_id_int = challan_row.id
            print(f"  Found challan_id: {challan_id_int}")

        # Verify challan exists using id column
        cursor.execute(
            """
            SELECT id
            FROM challans
            WHERE id = ?
            """,
            (challan_id_int,)
        )
        challan = cursor.fetchone()
        if not challan:
            print(f"❌ Challan with ID {challan_id_int} not found")
            raise HTTPException(
                status_code=404,
                detail="Challan not found"
            )
        print(f"✅ Challan verified: {challan_id_int}")

        # Insert expense
        query = """
            INSERT INTO expenses
            (
                challan_id,
                category,
                amount,
                expense_date,
                payment_method,
                vendor,
                description,
                receipt_number
            )
            OUTPUT INSERTED.expense_id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """

        print(f"  Executing INSERT with: challan_id={challan_id_int}, category={category}, amount={amount}")
        
        cursor.execute(
            query,
            (
                challan_id_int,
                category,
                amount,
                expense_date,
                payment_method,
                vendor,
                description,
                receipt_number
            )
        )

        result = cursor.fetchone()
        if not result:
            print("❌ No expense_id returned from INSERT")
            raise HTTPException(
                status_code=500,
                detail="Failed to create expense"
            )
            
        expense_id = result.expense_id
        cursor.connection.commit()
        print(f"✅ Expense created successfully with ID: {expense_id}")

        logger.info("Expense created successfully: %s", expense_id)

        # Return consistent response
        return {
            "success": True,
            "message": "Expense added successfully",
            "data": {
                "expense_id": expense_id,
                "id": expense_id,
                "challan_id": challan_id_int,
                "challanId": str(challan_id),
                "category": category,
                "amount": float(amount),
                "date": expense_date,
                "paymentMethod": payment_method,
                "vendor": vendor,
                "description": description,
                "receiptNumber": receipt_number
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        logger.exception("Error creating expense")
        try:
            cursor.connection.rollback()
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail=f"Failed to add expense: {str(e)}"
        )


# ============================================================
# UPDATE EXPENSE
# PUT /api/expenses/{expense_id}
# ============================================================
@router.put("/{expense_id}")
def update_expense(expense_id: int, expense: dict):
    try:
        cursor = db.get_cursor()

        if not cursor:
            raise HTTPException(
                status_code=500,
                detail="Database connection unavailable"
            )

        # Check existing expense
        cursor.execute(
            """
            SELECT expense_id
            FROM expenses
            WHERE expense_id = ?
            """,
            (expense_id,)
        )

        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        challan_id = (
            expense.get("challanId")
            or expense.get("challan_id")
        )

        category = expense.get("category")
        amount = expense.get("amount")

        expense_date = (
            expense.get("date")
            or expense.get("expense_date")
        )

        payment_method = (
            expense.get("paymentMethod")
            or expense.get("payment_method")
        )

        vendor = expense.get("vendor")
        description = expense.get("description")

        receipt_number = (
            expense.get("receiptNumber")
            or expense.get("receipt_number")
        )

        if not challan_id:
            raise HTTPException(
                status_code=400,
                detail="Challan ID is required"
            )

        if not category:
            raise HTTPException(
                status_code=400,
                detail="Category is required"
            )

        if amount is None or amount == "":
            raise HTTPException(
                status_code=400,
                detail="Amount is required"
            )

        try:
            # ✅ FIX: same quantize fix as create_expense — forces scale to
            # always be 2 so pyodbc doesn't hand SQL Server a scale-0
            # Decimal parameter for a DECIMAL(12,2) column, which is what
            # triggered "Arithmetic overflow error converting numeric to
            # data type numeric" (SQLSTATE 22003).
            amount = Decimal(str(amount)).quantize(Decimal("0.01"))

            if amount < 0:
                raise HTTPException(
                    status_code=400,
                    detail="Amount cannot be negative"
                )

            if amount > Decimal("9999999999.99"):
                raise HTTPException(
                    status_code=400,
                    detail="Amount is too large"
                )
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Amount parsing error: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid amount: {str(e)}"
            )

        # Find challan - use id column
        try:
            challan_id_int = int(challan_id)

        except (ValueError, TypeError):

            cursor.execute(
                """
                SELECT id
                FROM challans
                WHERE challan_no = ?
                """,
                (str(challan_id),)
            )

            challan_row = cursor.fetchone()

            if not challan_row:
                raise HTTPException(
                    status_code=404,
                    detail="Challan not found"
                )

            challan_id_int = challan_row.id

        # Update
        query = """
            UPDATE expenses
            SET
                challan_id = ?,
                category = ?,
                amount = ?,
                expense_date = ?,
                payment_method = ?,
                vendor = ?,
                description = ?,
                receipt_number = ?
            WHERE expense_id = ?
        """

        cursor.execute(
            query,
            (
                challan_id_int,
                category,
                amount,
                expense_date,
                payment_method,
                vendor,
                description,
                receipt_number,
                expense_id
            )
        )

        cursor.connection.commit()

        return {
            "success": True,
            "message": "Expense updated successfully",
            "data": {
                "expense_id": expense_id
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Error updating expense")

        try:
            cursor.connection.rollback()
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=f"Failed to update expense: {str(e)}"
        )


# ============================================================
# DELETE EXPENSE
# DELETE /api/expenses/{expense_id}
# ============================================================
@router.delete("/{expense_id}")
def delete_expense(expense_id: int):
    try:
        cursor = db.get_cursor()

        if not cursor:
            raise HTTPException(
                status_code=500,
                detail="Database connection unavailable"
            )

        cursor.execute(
            """
            SELECT expense_id
            FROM expenses
            WHERE expense_id = ?
            """,
            (expense_id,)
        )

        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Expense not found"
            )

        cursor.execute(
            """
            DELETE FROM expenses
            WHERE expense_id = ?
            """,
            (expense_id,)
        )

        cursor.connection.commit()

        return {
            "success": True,
            "message": "Expense deleted successfully",
            "expense_id": expense_id
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Error deleting expense")

        try:
            cursor.connection.rollback()
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete expense: {str(e)}"
        )


# ============================================================
# GET EXPENSES BY CHALLAN
# GET /api/expenses/challan/{challan_id}
# ============================================================
@router.get("/challan/{challan_id}")
def get_expenses_by_challan(challan_id: int):
    try:
        cursor = db.get_cursor()

        if not cursor:
            raise HTTPException(
                status_code=500,
                detail="Database connection unavailable"
            )

        query = """
            SELECT
                expense_id,
                challan_id,
                category,
                amount,
                expense_date,
                payment_method,
                vendor,
                description,
                receipt_number,
                created_at
            FROM expenses
            WHERE challan_id = ?
            ORDER BY expense_id DESC
        """

        cursor.execute(query, (challan_id,))
        rows = cursor.fetchall()

        expenses = []

        for row in rows:
            expenses.append({
                "expense_id": row.expense_id,
                "id": row.expense_id,
                "challan_id": row.challan_id,
                "challanId": row.challan_id,
                "category": row.category,
                "amount": float(row.amount or 0),
                "expense_date": (
                    row.expense_date.isoformat()
                    if row.expense_date
                    else None
                ),
                "date": (
                    row.expense_date.isoformat()
                    if row.expense_date
                    else None
                ),
                "payment_method": row.payment_method,
                "paymentMethod": row.payment_method,
                "vendor": row.vendor,
                "description": row.description,
                "receipt_number": row.receipt_number,
                "receiptNumber": row.receipt_number,
                "created_at": (
                    row.created_at.isoformat()
                    if row.created_at
                    else None
                )
            })

        total = sum(
            Decimal(str(item["amount"]))
            for item in expenses
        )

        return {
            "success": True,
            "challan_id": challan_id,
            "count": len(expenses),
            "total_expense": float(total),
            "data": expenses
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Error fetching challan expenses")

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch challan expenses: {str(e)}"
        )