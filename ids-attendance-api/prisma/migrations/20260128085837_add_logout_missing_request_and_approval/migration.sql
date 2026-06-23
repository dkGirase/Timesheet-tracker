-- CreateEnum
CREATE TYPE "LogoutRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "logout_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "requested_logout_time" TIMESTAMP(3) NOT NULL,
    "status" "LogoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logout_approval_actions" (
    "id" SERIAL NOT NULL,
    "logout_request_id" INTEGER NOT NULL,
    "approver_id" INTEGER NOT NULL,
    "action" "LogoutRequestStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logout_approval_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_logout_user_id" ON "logout_requests"("user_id");

-- CreateIndex
CREATE INDEX "idx_logout_approval_request_id" ON "logout_approval_actions"("logout_request_id");

-- AddForeignKey
ALTER TABLE "logout_requests" ADD CONSTRAINT "logout_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logout_approval_actions" ADD CONSTRAINT "logout_approval_actions_logout_request_id_fkey" FOREIGN KEY ("logout_request_id") REFERENCES "logout_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logout_approval_actions" ADD CONSTRAINT "logout_approval_actions_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
