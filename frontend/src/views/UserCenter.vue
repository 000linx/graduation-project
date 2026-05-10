<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-6 shadow-sm">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="text-2xl font-extrabold text-[var(--c-text)]">个人中心</div>
          <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
            <span v-if="profile.username">{{ profile.username }}</span>
            <span v-if="profile.phone">（{{ profile.phone }}）</span>
            <span v-if="!hasToken">未登录</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <el-button v-if="hasToken" :loading="logoutLoading" @click="logout">退出登录</el-button>
          <el-button v-else type="primary" @click="goHome">返回首页</el-button>
        </div>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="个人中心概览">
      <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-5 shadow-sm">
        <div class="text-sm font-semibold text-[var(--c-muted)]">待支付</div>
        <div class="mt-1 text-2xl font-extrabold text-[var(--c-text)]">
          {{ hasToken ? pendingCount : '-' }}
        </div>
        <div class="mt-3">
          <el-button :disabled="!hasToken" type="primary" plain @click="activeTab = 'orders'"
            >查看订单</el-button
          >
        </div>
      </div>

      <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-5 shadow-sm">
        <div class="text-sm font-semibold text-[var(--c-muted)]">售后处理中</div>
        <div class="mt-1 text-2xl font-extrabold text-[var(--c-text)]">
          {{ hasToken ? afterSalePendingCount : '-' }}
        </div>
        <div class="mt-3">
          <el-button :disabled="!hasToken" type="warning" plain @click="activeTab = 'orders'"
            >进入售后</el-button
          >
        </div>
      </div>

      <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl p-5 shadow-sm">
        <div class="text-sm font-semibold text-[var(--c-muted)]">默认地址</div>
        <div class="mt-1 text-base font-extrabold text-[var(--c-text)] truncate" :title="defaultAddressText">
          {{ hasToken ? defaultAddressText : '-' }}
        </div>
        <div class="mt-3">
          <el-button :disabled="!hasToken" type="success" plain @click="activeTab = 'address'"
            >管理地址</el-button
          >
        </div>
      </div>
    </div>

    <div class="mt-6 bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-3xl shadow-sm">
      <el-tabs v-model="activeTab" class="px-4">
        <el-tab-pane label="我的订单" name="orders">
          <div class="py-4 space-y-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="text-sm font-semibold text-[var(--c-muted)]">
                支持状态筛选、详情查看、支付、取消、评价与售后。
              </div>
              <div class="flex items-center gap-3">
                <el-select
                  v-model="orderStatus"
                  placeholder="订单状态"
                  style="width: 180px"
                  @change="fetchOrders"
                >
                  <el-option label="全部" value="" />
                  <el-option label="待支付" value="pending" />
                  <el-option label="已支付" value="paid" />
                  <el-option label="已发货" value="shipped" />
                  <el-option label="已送达" value="delivered" />
                  <el-option label="已完成" value="completed" />
                  <el-option label="取消申请中" value="cancel_requested" />
                  <el-option label="已取消" value="cancelled" />
                  <el-option label="售后处理中" value="after_sale_pending" />
                  <el-option label="售后已通过" value="after_sale_approved" />
                  <el-option label="售后已拒绝" value="after_sale_rejected" />
                </el-select>
                <el-button :loading="ordersLoading" @click="fetchOrders">刷新</el-button>
              </div>
            </div>

            <el-alert
              v-if="!hasToken"
              type="warning"
              show-icon
              title="未登录"
              description="请先登录后查看订单。"
            />
            <el-alert v-else-if="ordersError" type="error" show-icon :title="ordersError" />

            <el-table
              v-loading="ordersLoading"
              :data="orders"
              stripe
              size="small"
              class="bg-[var(--c-surface)] rounded-2xl border"
              :empty-text="hasToken ? '暂无订单' : '未登录'"
            >
              <el-table-column prop="_id" label="订单号" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">
                  <span data-testid="order-id" :data-order-id="row._id">{{ row._id }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="total_amount" label="金额" width="140">
                <template #default="{ row }">¥{{ Number(row.total_amount ?? 0).toFixed(2) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="140">
                <template #default="{ row }">
                  <el-tag :type="statusTagType(row.status)" data-testid="order-status">{{ statusLabel(row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" min-width="180" show-overflow-tooltip />
              <el-table-column label="操作" width="260" fixed="right">
                <template #default="{ row }">
                  <el-button data-testid="order-action-detail" link type="primary" @click="openDetail(row._id)">详情</el-button>
                  <el-button v-if="row.status === 'pending'" data-testid="order-action-pay" link type="success" @click="openPay(row._id)"
                    >支付</el-button
                  >
                  <el-button v-if="canCancel(row.status)" data-testid="order-action-cancel" link type="warning" @click="cancelOrder(row._id)"
                    >取消</el-button
                  >
                  <el-button
                    v-if="row.status === 'delivered'"
                    data-testid="order-action-confirm"
                    link
                    type="primary"
                    @click="confirmReceived(row._id)"
                    >确认收货</el-button
                  >
                  <el-button
                    v-if="row.status === 'delivered' || row.status === 'completed'"
                    data-testid="order-action-review"
                    link
                    type="primary"
                    @click="openReview(row._id)"
                    >评价</el-button
                  >
                  <el-button v-if="canAfterSale(row)" data-testid="order-action-after-sale" link type="danger" @click="openAfterSale(row._id)"
                    >售后</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="保养预约" name="maintenance">
          <div class="py-6 space-y-6">
            <el-alert
              v-if="!hasToken"
              type="warning"
              show-icon
              title="未登录"
              description="请先登录后提交保养预约。"
            />
            <template v-else>
              <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5">
                <div class="flex items-center justify-between gap-3 flex-nowrap overflow-x-auto">
                  <div>
                    <div class="text-base font-extrabold text-[var(--c-text)]">提交保养预约</div>
                    <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
                      系统将对时间冲突进行检测，并提供可预约时段推荐。
                    </div>
                  </div>
                  <el-button :loading="maintLoading" @click="refreshMaintenance">刷新</el-button>
                </div>

                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <el-form label-position="top" class="md:col-span-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <el-form-item label="关联订单（已购买）" required>
                        <el-select v-model="maintForm.order_id" placeholder="请选择订单" filterable @change="onOrderChange">
                          <el-option
                            v-for="o in eligibleOrders"
                            :key="o.order_id"
                            :label="`${o.order_id}（${o.status}）`"
                            :value="o.order_id"
                          />
                        </el-select>
                      </el-form-item>
                      <el-form-item label="保养设备/商品" required>
                        <el-select v-model="maintForm.product_id" placeholder="请选择商品" filterable>
                          <el-option
                            v-for="it in selectedOrderItems"
                            :key="it.product_id || it.name"
                            :label="it.name || it.product_id || '未知商品'"
                            :value="it.product_id || ''"
                          />
                        </el-select>
                      </el-form-item>
                      <el-form-item label="联系人" required>
                        <el-input v-model="maintForm.contact_name" placeholder="请输入联系人姓名" />
                      </el-form-item>
                      <el-form-item label="联系方式" required>
                        <el-input v-model="maintForm.contact_phone" placeholder="请输入手机号" />
                      </el-form-item>
                      <el-form-item label="预约日期" required>
                        <el-date-picker
                          v-model="maintForm.date"
                          type="date"
                          format="YYYY-MM-DD"
                          value-format="YYYY-MM-DD"
                          placeholder="请选择日期"
                          @change="fetchSlots"
                        />
                      </el-form-item>
                      <el-form-item label="推荐时段" required>
                        <el-select v-model="maintForm.preferred_start" placeholder="请选择时间段" filterable>
                          <el-option
                            v-for="s in slots"
                            :key="s.start"
                            :label="`${formatSlotLabel(s.start, s.end)}（score:${s.score.toFixed(1)}）`"
                            :value="s.start"
                          />
                        </el-select>
                      </el-form-item>
                      <el-form-item label="备注（可选）" class="md:col-span-2">
                        <el-input v-model="maintForm.notes" type="textarea" :rows="3" placeholder="如：希望更换耳塞/清洁/调试等" />
                      </el-form-item>
                    </div>
                    <div class="flex items-center gap-3">
                      <el-button type="primary" :loading="maintSubmitting" @click="submitAppointment">提交预约</el-button>
                      <div class="text-sm font-semibold text-[var(--c-muted)]" v-if="slots.length === 0 && maintForm.date">
                        暂无可预约时段，请更换日期
                      </div>
                    </div>
                  </el-form>
                </div>
              </div>

              <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5">
                <div class="text-base font-extrabold text-[var(--c-text)]">我的预约</div>
                <div class="mt-4">
                  <el-table :data="myAppointments" stripe size="small" class="rounded-2xl border">
                    <el-table-column prop="_id" label="预约号" min-width="220" show-overflow-tooltip />
                    <el-table-column label="状态" width="120">
                      <template #default="{ row }">
                        <el-tag :type="maintenanceStatusTag(row.status)">{{ maintenanceStatusLabel(row.status) }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="scheduled_start" label="预约时间" min-width="180" show-overflow-tooltip />
                    <el-table-column prop="contact_phone" label="联系方式" width="140" />
                    <el-table-column label="操作" width="160" fixed="right">
                      <template #default="{ row }">
                        <el-button
                          v-if="['pending', 'confirmed'].includes(String(row.status))"
                          link
                          type="danger"
                          @click="cancelAppointment(row._id)"
                          >取消</el-button
                        >
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>

              <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5">
                <div class="text-base font-extrabold text-[var(--c-text)]">历史保养档案</div>
                <div class="mt-4">
                  <el-table :data="myRecords" stripe size="small" class="rounded-2xl border">
                    <el-table-column prop="_id" label="记录号" min-width="220" show-overflow-tooltip />
                    <el-table-column prop="created_at" label="时间" min-width="180" show-overflow-tooltip />
                    <el-table-column label="费用" width="120">
                      <template #default="{ row }">¥{{ Number(row.total_cost ?? 0).toFixed(2) }}</template>
                    </el-table-column>
                    <el-table-column label="技师" width="140">
                      <template #default="{ row }">{{ row.technician?.name || '-' }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="160" fixed="right">
                      <template #default="{ row }">
                        <el-button link type="primary" @click="downloadRecordPdf(row._id)">导出PDF</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </template>
          </div>
        </el-tab-pane>

        <el-tab-pane label="个人资料" name="profile">
          <div class="py-6">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="用户名">{{ profile.username || '-' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ profile.phone || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="通知管理" name="notifications">
          <div class="py-6 max-w-2xl space-y-4">
            <el-alert
              v-if="!hasToken"
              type="warning"
              show-icon
              title="未登录"
              description="请先登录后管理通知设置。"
            />
            <div v-else class="space-y-4">
              <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div class="text-base font-extrabold text-[var(--c-text)]">通知偏好</div>
                  <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
                    关闭后将不会收到对应渠道的提醒（立即生效，重新登录后仍保持）。
                  </div>
                </div>
                <el-button
                  :disabled="notifLoading || notifSaving"
                  type="danger"
                  plain
                  aria-label="一键关闭所有通知"
                  @click="disableAllNotifications"
                >
                  一键关闭
                </el-button>
              </div>

              <div class="bg-[var(--c-surface)] border-2 border-[var(--c-border)] rounded-2xl p-5">
                <div class="flex items-center justify-between gap-4 py-2">
                  <div class="min-w-0">
                    <div class="font-extrabold text-[var(--c-text)]">邮件通知</div>
                    <div class="text-sm font-semibold text-[var(--c-muted)]">活动订阅、订单状态等邮件提醒</div>
                  </div>
                  <el-switch
                    v-model="notif.email_notifications"
                    :loading="notifLoading"
                    :disabled="notifLoading"
                    aria-label="切换邮件通知"
                    @change="scheduleNotifSave"
                  />
                </div>

                <div class="h-px bg-[var(--c-border)]/20 my-3" />

                <div class="flex items-center justify-between gap-4 py-2">
                  <div class="min-w-0">
                    <div class="font-extrabold text-[var(--c-text)]">站内消息</div>
                    <div class="text-sm font-semibold text-[var(--c-muted)]">站内提示与重要消息提醒</div>
                  </div>
                  <el-switch
                    v-model="notif.in_app_notifications"
                    :loading="notifLoading"
                    :disabled="notifLoading"
                    aria-label="切换站内消息"
                    @change="scheduleNotifSave"
                  />
                </div>

                <div class="h-px bg-[var(--c-border)]/20 my-3" />

                <div class="flex items-center justify-between gap-4 py-2">
                  <div class="min-w-0">
                    <div class="font-extrabold text-[var(--c-text)]">活动提醒</div>
                    <div class="text-sm font-semibold text-[var(--c-muted)]">限时活动、倒计时与促销提醒</div>
                  </div>
                  <el-switch
                    v-model="notif.activity_reminders"
                    :loading="notifLoading"
                    :disabled="notifLoading"
                    aria-label="切换活动提醒"
                    @change="scheduleNotifSave"
                  />
                </div>
              </div>

              <div
                class="text-sm font-semibold"
                :class="notifSaving ? 'text-[var(--c-muted)]' : 'text-[var(--c-success)]'"
                role="status"
                aria-live="polite"
              >
                <span v-if="notifSaving">正在保存…</span>
                <span v-else>设置已保存</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="账户安全" name="security">
          <div class="py-6 max-w-xl">
            <el-alert
              v-if="!hasToken"
              type="warning"
              show-icon
              title="未登录"
              description="请先登录后修改密码。"
              class="mb-4"
            />

            <div v-else class="space-y-4">
              <div>
                <div class="text-base font-extrabold text-[var(--c-text)]">修改密码</div>
                <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
                  修改成功后会自动退出，需要重新登录。
                </div>
              </div>

              <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="96px" status-icon>
                <el-form-item label="原密码" prop="old_password">
                  <el-input
                    v-model="pwdForm.old_password"
                    type="password"
                    show-password
                    autocomplete="current-password"
                  />
                </el-form-item>
                <el-form-item label="新密码" prop="new_password">
                  <el-input
                    v-model="pwdForm.new_password"
                    type="password"
                    show-password
                    autocomplete="new-password"
                  />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirm_password">
                  <el-input
                    v-model="pwdForm.confirm_password"
                    type="password"
                    show-password
                    autocomplete="new-password"
                  />
                </el-form-item>
                <el-form-item>
                  <div class="flex items-center gap-3">
                    <el-button type="primary" :loading="pwdSubmitting" @click="submitChangePassword"
                      >保存</el-button
                    >
                    <el-button :disabled="pwdSubmitting" @click="resetPwdForm">重置</el-button>
                  </div>
                </el-form-item>
              </el-form>

              <div class="border-t border-[var(--c-border)]/30 my-6" />

              <div>
                <div class="text-base font-extrabold text-red-500">注销账户</div>
                <div class="text-sm font-semibold text-[var(--c-muted)] mt-1">
                  注销后所有数据将被永久删除，此操作不可逆。提供15天冷静期，期间可撤销。
                </div>
              </div>

              <div class="flex items-center gap-3">
                <el-button type="danger" @click="deletionDialog?.open()">注销账户</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="已拥有助听器" name="devices">
          <div class="py-4 space-y-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="text-sm font-semibold text-[var(--c-muted)]">
                管理您绑定的所有助听器设备，支持查看详情、报修与解绑。
              </div>
              <div class="flex items-center gap-3">
                <el-button v-if="hasToken" type="primary" @click="openBindDevice">绑定新设备</el-button>
                <el-button :loading="deviceStore.loading" :disabled="!hasToken" @click="deviceStore.fetchDevices()">刷新</el-button>
              </div>
            </div>

            <el-alert v-if="!hasToken" type="warning" show-icon title="未登录" description="请先登录后管理设备。" />
            <el-alert v-else-if="deviceStore.error" type="error" show-icon :title="deviceStore.error" />

            <div v-if="hasToken && deviceStore.devices.length === 0 && !deviceStore.loading" class="text-center py-12 bg-[var(--c-bg)] border-2 border-dashed border-[var(--c-border)] rounded-2xl">
              <Cpu class="h-12 w-12 mx-auto icon-tone--muted mb-3" />
              <div class="text-base font-extrabold text-[var(--c-muted)]">暂无已绑定设备</div>
              <div class="text-sm font-semibold text-[var(--c-muted)] mt-1 mb-4">点击"绑定新设备"添加您的助听器</div>
              <el-button type="primary" @click="openBindDevice">绑定新设备</el-button>
            </div>

            <div v-else-if="hasToken" v-loading="deviceStore.loading" class="space-y-3">
              <DeviceCard
                v-for="device in deviceStore.devices"
                :key="device._id"
                :device="device"
                @unbind="confirmUnbind"
                @report-repair="handleDeviceRepair"
              />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="收货地址" name="address">
          <div class="py-4 space-y-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="text-sm font-semibold text-[var(--c-muted)]">
                支持新增、编辑、删除与默认地址设置。
              </div>
              <div class="flex items-center gap-3">
                <el-button :disabled="!hasToken" type="primary" @click="openAddAddress">新增地址</el-button>
                <el-button :loading="addressLoading" :disabled="!hasToken" @click="fetchAddresses"
                  >刷新</el-button
                >
              </div>
            </div>

            <el-alert
              v-if="!hasToken"
              type="warning"
              show-icon
              title="未登录"
              description="请先登录后管理收货地址。"
            />
            <el-alert v-else-if="addressError" type="error" show-icon :title="addressError" />

            <el-table
              v-loading="addressLoading"
              :data="addresses"
              stripe
              size="small"
              class="bg-[var(--c-surface)] rounded-2xl border"
              :empty-text="hasToken ? '暂无地址' : '未登录'"
            >
              <el-table-column label="收货人" min-width="120">
                <template #default="{ row }">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{{ row.receiver }}</span>
                    <el-tag v-if="row.is_default" type="success">默认</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="phone" label="手机号" width="140" />
              <el-table-column label="地址" min-width="260" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.province }}{{ row.city }}{{ row.district }}{{ row.detail }}
                </template>
              </el-table-column>
              <el-table-column prop="label" label="标签" width="120" />
              <el-table-column label="操作" width="240" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openEditAddress(row)">编辑</el-button>
                  <el-button link type="danger" @click="removeAddress(row)">删除</el-button>
                  <el-button v-if="!row.is_default" link type="success" @click="setDefault(row)"
                    >设为默认</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <el-drawer v-model="detailOpen" title="订单详情" size="520px">
    <div v-if="detailLoading" class="text-gray-500">正在加载...</div>
    <el-alert v-else-if="detailError" type="error" show-icon :title="detailError" />
    <div v-else-if="orderDetail" class="space-y-4">
      <div class="text-sm font-semibold text-[var(--c-muted)]">订单号：{{ orderDetail._id }}</div>
      <div class="flex items-center justify-between">
        <div class="text-lg font-extrabold text-[var(--c-text)]">
          金额：¥{{ Number(orderDetail.total_amount ?? 0).toFixed(2) }}
        </div>
        <el-tag :type="statusTagType(orderDetail.status)">{{ statusLabel(orderDetail.status) }}</el-tag>
      </div>
      <div class="text-sm font-semibold text-[var(--c-muted)]">
        收货地址：{{ orderDetail.shipping_address || '-' }}
      </div>
      <div v-if="orderDetail.coupon" class="text-sm font-semibold text-[var(--c-muted)]">
        优惠券：{{ orderDetail.coupon.code }}（-¥{{ Number(orderDetail.coupon.discount_amount ?? 0).toFixed(2) }}）
      </div>
      <div class="text-sm font-semibold text-[var(--c-muted)]">支付：{{ paymentText }}</div>
      <div v-if="orderDetail.shipping" class="text-sm font-semibold text-[var(--c-muted)]">
        物流：{{ orderDetail.shipping.carrier }} / {{ orderDetail.shipping.tracking_no }} /
        {{ orderDetail.shipping.status }}
      </div>
      <div v-if="orderDetail.cancel_request" class="text-sm font-semibold text-[var(--c-muted)]">
        取消原因：{{ orderDetail.cancel_request.reason }}
      </div>
      <div v-if="orderDetail.after_sale" class="text-sm font-semibold text-[var(--c-muted)]">
        售后：{{ orderDetail.after_sale.type }} / {{ orderDetail.after_sale.status }} /
        {{ orderDetail.after_sale.reason }}
      </div>
      <div v-if="orderDetail.review" class="text-sm font-semibold text-[var(--c-muted)]">
        评价：{{ orderDetail.review.rating }} 星 / {{ orderDetail.review.content }}
      </div>
      <div class="text-base font-extrabold text-[var(--c-text)] mt-4">商品项</div>
      <el-table :data="orderDetail.items || []" stripe size="small" class="border rounded-xl">
        <el-table-column prop="name" label="商品" min-width="160" show-overflow-tooltip />
        <el-table-column prop="product_id" label="商品ID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="unit_price" label="单价" width="120">
          <template #default="{ row }">¥{{ Number(row.unit_price ?? 0).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>

  <el-dialog v-model="payOpen" title="订单支付" width="420px">
    <div class="space-y-4">
      <el-select v-model="payMethod" placeholder="选择支付方式" style="width: 100%">
        <el-option label="微信支付" value="wechat" />
        <el-option label="支付宝" value="alipay" />
        <el-option label="银行卡" value="card" />
      </el-select>
    </div>
    <template #footer>
      <el-button @click="payOpen = false">取消</el-button>
      <el-button type="primary" :loading="payLoading" :disabled="!payMethod" @click="submitPay"
        >确认支付</el-button
      >
    </template>
  </el-dialog>

  <el-dialog v-model="reviewOpen" title="订单评价" width="520px">
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div class="text-sm text-gray-600 w-16">评分</div>
        <el-rate v-model="reviewForm.rating" />
      </div>
      <el-input v-model="reviewForm.content" type="textarea" :rows="4" placeholder="请输入评价内容" />
    </div>
    <template #footer>
      <el-button @click="reviewOpen = false">取消</el-button>
      <el-button type="primary" :loading="reviewLoading" @click="submitReview">提交</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="afterSaleOpen" title="售后申请" width="520px">
    <div class="space-y-4">
      <el-select v-model="afterSaleForm.type" placeholder="选择售后类型" style="width: 100%">
        <el-option label="仅退款" value="refund" />
        <el-option label="退货退款" value="return" />
        <el-option label="维修" value="repair" />
      </el-select>
      <el-input v-model="afterSaleForm.reason" type="textarea" :rows="4" placeholder="请详细描述售后原因（必填）" />
    </div>
    <template #footer>
      <el-button @click="afterSaleOpen = false">取消</el-button>
      <el-button
        type="primary"
        :loading="afterSaleLoading"
        :disabled="!afterSaleForm.type || !afterSaleForm.reason.trim()"
        @click="submitAfterSale"
        >提交</el-button
      >
    </template>
  </el-dialog>

  <el-drawer v-model="addressOpen" :title="addressEditingId ? '编辑地址' : '新增地址'" size="520px">
    <el-alert
      v-if="!hasToken"
      type="warning"
      show-icon
      title="未登录"
      description="请先登录后管理收货地址。"
      class="mb-4"
    />

    <el-form
      v-else
      ref="addressFormRef"
      :model="addressForm"
      :rules="addressRules"
      label-position="top"
      status-icon
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <el-form-item label="收货人" prop="receiver">
          <el-input v-model="addressForm.receiver" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="addressForm.phone"
            placeholder="请输入手机号"
            inputmode="numeric"
            autocomplete="tel"
          />
        </el-form-item>
        <el-form-item label="省份" prop="province">
          <el-input v-model="addressForm.province" placeholder="如：北京市" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="addressForm.city" placeholder="如：北京市" />
        </el-form-item>
        <el-form-item label="区/县" prop="district">
          <el-input v-model="addressForm.district" placeholder="如：海淀区" />
        </el-form-item>
        <el-form-item label="标签" prop="label">
          <el-input v-model="addressForm.label" placeholder="如：家/公司（可选）" />
        </el-form-item>
      </div>
      <el-form-item label="详细地址" prop="detail">
        <el-input v-model="addressForm.detail" type="textarea" :rows="3" placeholder="街道、门牌号等" />
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="addressForm.is_default">设为默认地址</el-checkbox>
      </el-form-item>
      <el-form-item>
        <div class="flex items-center gap-3">
          <el-button type="primary" :loading="addressSaving" @click="saveAddress">保存</el-button>
          <el-button :disabled="addressSaving" @click="resetAddressForm">重置</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-drawer>

  <BindDeviceDialog ref="bindDeviceDialog" @success="deviceStore.fetchDevices()" />

  <AccountDeletion ref="deletionDialog" @logout="logout" />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import http, { unwrap } from '../api/http'
import { useUserAuthStore } from '../stores/userAuth'
import { useDeviceStore } from '../stores/device'
import DeviceCard from '../components/DeviceCard.vue'
import BindDeviceDialog from '../components/BindDeviceDialog.vue'
import AccountDeletion from '../components/AccountDeletion.vue'
import { Cpu } from 'lucide-vue-next'

const router = useRouter()
const userAuth = useUserAuthStore()
const activeTab = ref<'orders' | 'maintenance' | 'profile' | 'notifications' | 'security' | 'address' | 'devices'>('orders')
const deviceStore = useDeviceStore()

const hasToken = computed(() => userAuth.verified)
const logoutLoading = ref(false)

const profile = reactive<{ username: string; phone: string }>({ username: '', phone: '' })

type NotificationSettings = {
  email_notifications: boolean
  in_app_notifications: boolean
  activity_reminders: boolean
}

const notifLoading = ref(false)
const notifSaving = ref(false)
const notif = reactive<NotificationSettings>({
  email_notifications: true,
  in_app_notifications: true,
  activity_reminders: true
})
let notifPending: NotificationSettings | null = null

type Order = {
  _id: string
  status: string
  total_amount?: number
  created_at?: string
  after_sale?: any
}

type EligibleOrderItem = {
  product_id: string | null
  name?: string
  quantity?: number
  price?: number
}

type EligibleOrder = {
  order_id: string
  status: string
  created_at?: string
  total_amount?: number
  items: EligibleOrderItem[]
}

const maintLoading = ref(false)
const maintSubmitting = ref(false)
const eligibleOrders = ref<EligibleOrder[]>([])
const slots = ref<{ start: string; end: string; score: number }[]>([])
const myAppointments = ref<any[]>([])
const myRecords = ref<any[]>([])

const maintForm = reactive({
  order_id: '',
  product_id: '',
  contact_name: '',
  contact_phone: '',
  date: '',
  preferred_start: '',
  notes: ''
})

const selectedOrderItems = computed<EligibleOrderItem[]>(() => {
  const o = eligibleOrders.value.find((x) => x.order_id === maintForm.order_id)
  return (o?.items || []).filter((it) => it && (it.product_id || it.name)) as EligibleOrderItem[]
})

const orderStatus = ref<string>('')
const ordersLoading = ref(false)
const ordersError = ref<string | null>(null)
const orders = ref<Order[]>([])

const detailOpen = ref(false)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)
const orderDetail = ref<any | null>(null)

const payOpen = ref(false)
const payLoading = ref(false)
const payOrderId = ref<string | null>(null)
const payMethod = ref<string>('')

const reviewOpen = ref(false)
const reviewLoading = ref(false)
const reviewOrderId = ref<string | null>(null)
const reviewForm = reactive({ rating: 5, content: '' })

const afterSaleOpen = ref(false)
const afterSaleLoading = ref(false)
const afterSaleOrderId = ref<string | null>(null)
const afterSaleForm = reactive({ type: '', reason: '' })

const pwdFormRef = ref<FormInstance>()
const pwdSubmitting = ref(false)
const pwdForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const pwdRules: FormRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码至少 6 位', trigger: 'blur' }
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== pwdForm.new_password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

type Address = {
  _id: string
  receiver: string
  phone: string
  province: string
  city: string
  district: string
  detail: string
  label?: string
  is_default: boolean
}

const addressLoading = ref(false)
const addressError = ref<string | null>(null)
const addresses = ref<Address[]>([])

const pendingCount = computed(() => {
  return orders.value.filter((o) => String(o.status) === 'pending').length
})

const afterSalePendingCount = computed(() => {
  return orders.value.filter((o) => String(o.status) === 'after_sale_pending').length
})

const defaultAddressText = computed(() => {
  const d = addresses.value.find((a) => a.is_default)
  if (!d) return '暂无默认地址'
  const label = d.label ? `${d.label} · ` : ''
  return `${label}${d.province}${d.city}${d.district}${d.detail}`
})

const addressOpen = ref(false)
const addressSaving = ref(false)
const addressEditingId = ref<string | null>(null)
const addressFormRef = ref<FormInstance>()
const addressForm = reactive({
  receiver: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  label: '',
  is_default: false
})

const addressRules: FormRules = {
  receiver: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        const v = String(value || '').trim()
        if (!/^1\d{10}$/.test(v)) callback(new Error('请输入 11 位手机号'))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  district: [{ required: true, message: '请输入区/县', trigger: 'blur' }],
  detail: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

const paymentText = computed(() => {
  const p = orderDetail.value?.payment
  if (!p) return '-'
  const s = p.status || '-'
  const m = p.method ? `(${p.method})` : ''
  return `${s}${m}`
})

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    shipped: '已发货',
    delivered: '已送达',
    completed: '已完成',
    cancel_requested: '取消申请中',
    cancelled: '已取消',
    after_sale_pending: '售后处理中',
    after_sale_approved: '售后已通过',
    after_sale_rejected: '售后已拒绝'
  }
  return map[String(status)] ?? String(status)
}

function statusTagType(status: string) {
  const s = String(status)
  if (s === 'paid' || s === 'completed') return 'success'
  if (s === 'shipped' || s === 'delivered' || s === 'after_sale_pending') return 'warning'
  if (s === 'after_sale_rejected') return 'danger'
  if (s === 'cancelled') return 'info'
  return 'default'
}

function canCancel(status: string) {
  return !['cancelled', 'completed', 'cancel_requested'].includes(String(status))
}

function canAfterSale(order: any) {
  const status = String(order?.status || '')
  if (order?.after_sale) return false
  return ['paid', 'shipped', 'delivered', 'completed'].includes(status)
}

function maintenanceStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
    rejected: '已拒绝'
  }
  return map[String(status)] ?? String(status)
}

function maintenanceStatusTag(status: string) {
  const s = String(status)
  if (s === 'confirmed' || s === 'completed') return 'success'
  if (s === 'pending') return 'warning'
  if (s === 'rejected') return 'danger'
  if (s === 'cancelled') return 'info'
  return 'default'
}

function formatSlotLabel(start: string, end: string) {
  const s = String(start).replace('T', ' ')
  const e = String(end).replace('T', ' ')
  return `${s} ~ ${e}`
}

async function fetchEligibleOrders() {
  const res = await http.get('/api/maintenance/eligible')
  eligibleOrders.value = unwrap(res) as EligibleOrder[]
  if (!maintForm.order_id && eligibleOrders.value.length) {
    maintForm.order_id = eligibleOrders.value[0].order_id
  }
  if (!maintForm.product_id) {
    const it = selectedOrderItems.value[0]
    maintForm.product_id = String(it?.product_id || '')
  }
}

async function fetchSlots() {
  slots.value = []
  maintForm.preferred_start = ''
  const day = String(maintForm.date || '').trim()
  if (!day) return
  const res = await http.get('/api/maintenance/slots', { params: { date: day, limit: 16 } })
  const data = unwrap(res) as any
  slots.value = (data?.slots || []) as { start: string; end: string; score: number }[]
}

async function fetchMyAppointments() {
  const res = await http.get('/api/maintenance/appointments', { params: { page: 1, page_size: 50 } })
  const data = unwrap(res) as any
  myAppointments.value = data?.items || []
}

async function fetchMyRecords() {
  const res = await http.get('/api/maintenance/records', { params: { page: 1, page_size: 50 } })
  const data = unwrap(res) as any
  myRecords.value = data?.items || []
}

async function refreshMaintenance() {
  if (!hasToken.value) return
  maintLoading.value = true
  try {
    await Promise.all([fetchEligibleOrders(), fetchMyAppointments(), fetchMyRecords()])
    if (maintForm.date) await fetchSlots()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载保养预约信息失败')
  } finally {
    maintLoading.value = false
  }
}

function onOrderChange() {
  const it = selectedOrderItems.value[0]
  maintForm.product_id = String(it?.product_id || '')
}

async function submitAppointment() {
  if (!maintForm.order_id || !maintForm.product_id || !maintForm.contact_name || !maintForm.contact_phone || !maintForm.preferred_start) {
    ElMessage.warning('请填写完整预约信息')
    return
  }
  maintSubmitting.value = true
  try {
    await http.post('/api/maintenance/appointments', {
      order_id: maintForm.order_id,
      product_id: maintForm.product_id,
      contact_name: maintForm.contact_name,
      contact_phone: maintForm.contact_phone,
      preferred_start: maintForm.preferred_start,
      notes: maintForm.notes
    })
    ElMessage.success('预约已提交，等待管理员确认')
    await fetchMyAppointments()
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    maintSubmitting.value = false
  }
}

async function cancelAppointment(appointmentId: string) {
  try {
    await ElMessageBox.confirm('确认取消该预约？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await http.post(`/api/maintenance/appointments/${appointmentId}/cancel`, { reason: '用户取消' })
    ElMessage.success('已取消')
    await fetchMyAppointments()
  } catch (e: any) {
    ElMessage.error(e?.message || '取消失败')
  }
}

async function downloadRecordPdf(recordId: string) {
  try {
    const res = await http.get(`/api/maintenance/records/${recordId}/pdf`, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maintenance-record-${recordId}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败')
  }
}

watch(
  () => activeTab.value,
  (v) => {
    if (v === 'maintenance') refreshMaintenance()
    if (v === 'devices') deviceStore.fetchDevices()
  }
)

async function fetchProfile() {
  if (!hasToken.value) return
  try {
    const resp = await http.get('/api/user/profile')
    const data = unwrap<{ username?: string; phone?: string; notification_settings?: NotificationSettings }>(resp)
    profile.username = String(data?.username ?? '')
    profile.phone = String(data?.phone ?? '')
    const s = data?.notification_settings
    if (s && typeof s === 'object') {
      notif.email_notifications = Boolean((s as any).email_notifications)
      notif.in_app_notifications = Boolean((s as any).in_app_notifications)
      notif.activity_reminders = Boolean((s as any).activity_reminders)
    }
  } catch {
    profile.username = ''
    profile.phone = ''
  }
}

async function fetchNotificationSettings() {
  if (!hasToken.value) return
  notifLoading.value = true
  try {
    const resp = await http.get('/api/user/notification_settings')
    const data = unwrap<{ notification_settings?: NotificationSettings }>(resp)
    const s = data?.notification_settings
    if (s && typeof s === 'object') {
      notif.email_notifications = Boolean((s as any).email_notifications)
      notif.in_app_notifications = Boolean((s as any).in_app_notifications)
      notif.activity_reminders = Boolean((s as any).activity_reminders)
    }
  } catch {
  } finally {
    notifLoading.value = false
  }
}

function scheduleNotifSave() {
  if (!hasToken.value) return
  const snap: NotificationSettings = {
    email_notifications: Boolean(notif.email_notifications),
    in_app_notifications: Boolean(notif.in_app_notifications),
    activity_reminders: Boolean(notif.activity_reminders)
  }
  if (notifSaving.value) {
    notifPending = snap
    return
  }
  void saveNotificationSettings(snap)
}

async function saveNotificationSettings(s: NotificationSettings) {
  if (!hasToken.value) return
  notifSaving.value = true
  try {
    const resp = await http.put('/api/user/notification_settings', s)
    const data = unwrap<{ notification_settings?: NotificationSettings }>(resp)
    const out = data?.notification_settings
    if (out && typeof out === 'object') {
      notif.email_notifications = Boolean((out as any).email_notifications)
      notif.in_app_notifications = Boolean((out as any).in_app_notifications)
      notif.activity_reminders = Boolean((out as any).activity_reminders)
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    notifSaving.value = false
    if (notifPending) {
      const next = notifPending
      notifPending = null
      void saveNotificationSettings(next)
    }
  }
}

function disableAllNotifications() {
  notif.email_notifications = false
  notif.in_app_notifications = false
  notif.activity_reminders = false
  scheduleNotifSave()
}

async function fetchOrders() {
  if (!hasToken.value) return
  ordersLoading.value = true
  ordersError.value = null
  try {
    const resp = await http.get('/api/order/history', {
      params: orderStatus.value ? { status: orderStatus.value } : {}
    })
    const data = unwrap<{ orders: Order[] }>(resp)
    orders.value = Array.isArray(data?.orders) ? data.orders : []
  } catch (e: any) {
    ordersError.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    ordersLoading.value = false
  }
}

async function fetchAddresses() {
  if (!hasToken.value) return
  addressLoading.value = true
  addressError.value = null
  try {
    const resp = await http.get('/api/user/addresses')
    const data = unwrap<{ addresses: Address[] }>(resp)
    addresses.value = Array.isArray(data?.addresses) ? data.addresses : []
  } catch (e: any) {
    addressError.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    addressLoading.value = false
  }
}

function resetAddressForm() {
  addressForm.receiver = ''
  addressForm.phone = ''
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.detail = ''
  addressForm.label = ''
  addressForm.is_default = false
  addressFormRef.value?.clearValidate()
}

function openAddAddress() {
  addressEditingId.value = null
  resetAddressForm()
  addressOpen.value = true
}

function openEditAddress(row: Address) {
  addressEditingId.value = row._id
  addressForm.receiver = row.receiver
  addressForm.phone = row.phone
  addressForm.province = row.province
  addressForm.city = row.city
  addressForm.district = row.district
  addressForm.detail = row.detail
  addressForm.label = row.label || ''
  addressForm.is_default = Boolean(row.is_default)
  addressOpen.value = true
}

async function saveAddress() {
  if (!hasToken.value) return
  const formInst = addressFormRef.value
  if (!formInst) return
  const ok = await formInst.validate().catch(() => false)
  if (!ok) return

  addressSaving.value = true
  try {
    const payload = {
      receiver: addressForm.receiver.trim(),
      phone: addressForm.phone.trim(),
      province: addressForm.province.trim(),
      city: addressForm.city.trim(),
      district: addressForm.district.trim(),
      detail: addressForm.detail.trim(),
      label: addressForm.label.trim() || undefined,
      is_default: Boolean(addressForm.is_default)
    }

    if (addressEditingId.value) {
      await http.put(`/api/user/addresses/${encodeURIComponent(addressEditingId.value)}`, payload)
      ElMessage.success('地址已更新')
    } else {
      await http.post('/api/user/addresses', payload)
      ElMessage.success('地址已新增')
    }

    addressOpen.value = false
    await fetchAddresses()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '保存失败')
  } finally {
    addressSaving.value = false
  }
}

async function removeAddress(row: Address) {
  if (!hasToken.value) return
  const ok = await ElMessageBox.confirm('确认删除该地址吗？', '删除地址', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).catch(() => false)
  if (!ok) return

  try {
    await http.delete(`/api/user/addresses/${encodeURIComponent(row._id)}`)
    ElMessage.success('已删除')
    await fetchAddresses()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败')
  }
}

async function setDefault(row: Address) {
  if (!hasToken.value) return
  try {
    await http.put(`/api/user/addresses/${encodeURIComponent(row._id)}/default`)
    ElMessage.success('默认地址已更新')
    await fetchAddresses()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '设置失败')
  }
}

async function openDetail(orderId: string) {
  detailOpen.value = true
  detailLoading.value = true
  detailError.value = null
  orderDetail.value = null
  try {
    const resp = await http.get(`/api/order/${encodeURIComponent(orderId)}`)
    orderDetail.value = unwrap<any>(resp)
  } catch (e: any) {
    detailError.value = e?.response?.data?.message || e?.message || '加载失败'
  } finally {
    detailLoading.value = false
  }
}

function openPay(orderId: string) {
  payOrderId.value = orderId
  payMethod.value = ''
  payOpen.value = true
}

async function submitPay() {
  if (!payOrderId.value || !payMethod.value) return
  payLoading.value = true
  try {
    await http.post(`/api/order/${encodeURIComponent(payOrderId.value)}/pay`, {
      payment_method: payMethod.value
    })
    ElMessage.success('支付成功')
    payOpen.value = false
    await fetchOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '支付失败')
  } finally {
    payLoading.value = false
  }
}

async function cancelOrder(orderId: string) {
  const { value, action } = await ElMessageBox.prompt('请输入取消原因（可选）', '取消订单', {
    confirmButtonText: '提交',
    cancelButtonText: '取消',
    inputPlaceholder: '原因'
  }).catch(() => ({ value: '', action: 'cancel' }))
  if (action !== 'confirm') return

  try {
    await http.put(`/api/order/${encodeURIComponent(orderId)}/cancel`, { reason: value })
    ElMessage.success('已提交取消申请')
    await fetchOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '取消失败')
  }
}

async function confirmReceived(orderId: string) {
  const ok = await ElMessageBox.confirm('确认已收到商品？', '确认收货', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).catch(() => false)
  if (!ok) return

  try {
    await http.post(`/api/order/${encodeURIComponent(orderId)}/confirm_received`)
    ElMessage.success('已确认收货')
    await fetchOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '确认失败')
  }
}

function openReview(orderId: string) {
  reviewOrderId.value = orderId
  reviewForm.rating = 5
  reviewForm.content = ''
  reviewOpen.value = true
}

async function submitReview() {
  if (!reviewOrderId.value) return
  reviewLoading.value = true
  try {
    await http.post(`/api/order/${encodeURIComponent(reviewOrderId.value)}/review`, {
      rating: reviewForm.rating,
      content: reviewForm.content
    })
    ElMessage.success('评价已提交')
    reviewOpen.value = false
    await fetchOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '提交失败')
  } finally {
    reviewLoading.value = false
  }
}

function openAfterSale(orderId: string) {
  afterSaleOrderId.value = orderId
  afterSaleForm.type = ''
  afterSaleForm.reason = ''
  afterSaleOpen.value = true
}

async function submitAfterSale() {
  if (!afterSaleOrderId.value || !afterSaleForm.type || !afterSaleForm.reason.trim()) {
    if (!afterSaleForm.reason.trim()) {
      ElMessage.warning('请填写售后原因说明')
    }
    return
  }
  afterSaleLoading.value = true
  try {
    await http.post(`/api/order/${encodeURIComponent(afterSaleOrderId.value)}/after_sale`, {
      type: afterSaleForm.type,
      reason: afterSaleForm.reason
    })
    ElMessage.success('售后申请已提交')
    afterSaleOpen.value = false
    await fetchOrders()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '提交失败')
  } finally {
    afterSaleLoading.value = false
  }
}

function goHome() {
  router.replace('/')
}

async function logout() {
  logoutLoading.value = true
  try {
    await userAuth.logout()
  } catch {
  } finally {
    profile.username = ''
    profile.phone = ''
    orders.value = []
    ElMessage.success('已退出')
    logoutLoading.value = false
    router.replace('/')
  }
}

const bindDeviceDialog = ref<InstanceType<typeof BindDeviceDialog>>()
const deletionDialog = ref<InstanceType<typeof AccountDeletion>>()

function openBindDevice() {
  bindDeviceDialog.value?.show()
}

async function confirmUnbind(deviceId: string) {
  const ok = await ElMessageBox.confirm('确认解绑该设备吗？解绑后设备数据将被移除。', '解绑设备', {
    confirmButtonText: '解绑',
    cancelButtonText: '取消',
    type: 'warning'
  }).catch(() => false)
  if (!ok) return

  try {
    await deviceStore.unbindDevice(deviceId)
    ElMessage.success('设备已解绑')
  } catch {
    ElMessage.error('解绑失败，请重试')
  }
}

function handleDeviceRepair(deviceId: string) {
  activeTab.value = 'maintenance'
  ElMessage.info('请在保养预约页面选择对应设备提交报修')
}

function resetPwdForm() {
  pwdForm.old_password = ''
  pwdForm.new_password = ''
  pwdForm.confirm_password = ''
  pwdFormRef.value?.clearValidate()
}

async function submitChangePassword() {
  if (!hasToken.value) return
  const form = pwdFormRef.value
  if (!form) return
  const ok = await form.validate().catch(() => false)
  if (!ok) return

  pwdSubmitting.value = true
  try {
    await http.post('/api/user/change_password', {
      old_password: pwdForm.old_password,
      new_password: pwdForm.new_password,
      confirm_password: pwdForm.confirm_password
    })
    ElMessage.success('密码修改成功，请重新登录')
    resetPwdForm()
    await logout()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '修改失败')
  } finally {
    pwdSubmitting.value = false
  }
}

onMounted(async () => {
  await userAuth.verifyUser()
  if (hasToken.value) {
    await fetchProfile()
    await fetchOrders()
    await fetchAddresses()
    await fetchNotificationSettings()
  }
})
</script>
