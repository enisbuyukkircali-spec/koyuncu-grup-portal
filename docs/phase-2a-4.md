# Phase 2A-4 — Talep ve izin

Mevcut Phase 2A-1 branch / Neon PostgreSQL / RBAC korunur. Migration: `db/005_workflows.sql`; mevcut Vercel build migration çalıştırır. Yeni environment variable veya servis yoktur.

## Kurulum
- `/admin/request-types`: örnek türler pasif gelir. Sorumlu departmanı seçip aktifleştirin. Varsayılan sorumlu aynı departmanda `requests.manage` ve `admin.view` yetkili olmalıdır.
- Kullanıcının Bağlı Yönetici alanını doldurun. Onay alacak kullanıcıda `approvals.view` ve `approvals.approve` bulunmalıdır (MANAGER rolünün varsayılanı).
- `/admin/leave-types`: bakiye/belge/yarım gün/yönetici/İK seçeneklerini ayarlayın.
- `/admin/leave-balances`: gerçek hakları gerekçeli hareket olarak girin. Otomatik 14 gün hak yüklenmez.
- İK aşaması için aktif, `admin.view`, `leave.manage`, `approvals.view`, `approvals.approve` izinli ve talep sahibinden farklı kullanıcı gerekir. Bu kişi talep anında atanır; yönetici ve İK geçmişi sonradan değiştirilmez.

## Kurallar
Genel talep: kişi → gerekiyorsa kişisel yönetici → sorumlu departman / varsayılan sorumlu → işlem → tamamlandı. Yönetim hem permission hem departman sınırı gerektirir; SUPER_ADMIN kapsam istisnasıdır. Portal detayları yalnızca sahibine, admin detayları yetkili kapsamına açıktır. Onay ekranı yalnızca atanmış kişiye aittir; SUPER_ADMIN başka kişinin onayını taklit edemez.

İzin: kişisel manager_user_id snapshot'ı → tür ayarına göre yönetici → gerekiyorsa atanmış İK → onay. Yönetici bulunmaması açıklayıcı hatadır. Yönetici aşaması türde kapalıysa İK'ya doğrudan gider; iki onay da kapalıysa otomatik onaylanır. Takvim UTC tarihleriyle hesaplanır; cumartesi/pazar hariç, tek tarih AM/PM 0.5 gün; karşıt yarımlar çakışmaz. Tatil dizisi için hazır fonksiyon vardır, API yoktur.

Toplam = gerekçeli manuel hareketler toplamı. Kullanılan = yalnızca tamamen onaylanmış iznin tekil debit hareketleri. Bekleyen = bakiye kullanan aktif onay aşamalarının günleri. Kalan = toplam − kullanılan − bekleyen. Yetersiz bakiye ve negatif kalan yaratacak düzeltme engellenir. Reddedilen/iptal bekleyenler bakiye harcamaz. Tam onaylı izin kullanıcı tarafından iptal edilemez; bu fazda ters-onay akışı yoktur. İK gerekçeli bakiye düzeltmesi yapabilir; onay geçmişi değişmez.

Mevcut transaction helper ve app_lock kullanılır; yazmada güncel yetki yeniden kontrol edilir. Kritik kayıtlar FOR UPDATE ile kilitlenir. Bu, aynı uygulamadaki eşzamanlı onay/çakışma/bakiye işlemlerini seri hale getirir. Approval stage ve leave debit unique indexleri, immutable history/ledger/completed approval/final leave trigger'ları ve deferred onay-debit tutarlılık trigger'ı eklenmiştir. Global write lock mevcut modelle uyumludur; yüksek yazma trafiğinde ayrı değerlendirilmelidir.

Dosyalar mevcut küçük dosya yaklaşımına uygun aynı DB'de, tek ek, en fazla 200 KB PDF/PNG/JPEG/WebP olarak saklanır; tür, boyut ve imza doğrulanır; indirme owner/department/assigned approver yetkisine bağlıdır. Audit dosya/açıklama içeriğini kopyalamaz. Notification foundation yalnızca recipient/event/entity kaydeder; e-mail/SMS/push göndermez.

## Ekranlar
Portal: `/requests`, `/requests/new`, `/requests/[id]`, `/leave`, `/leave/new`, `/leave/[id]`, `/approvals`.
Admin: `/admin/requests`, `/admin/requests/[id]`, `/admin/request-types`, `/admin/leave`, `/admin/leave/[id]`, `/admin/leave-types`, `/admin/leave-balances`.
API: `/api/workflows/[...path]` (kimlik, server permission/scope, mevcut origin/JSON koruması).

Dashboard tasarımı korunur: iki demo sayaç gerçek count ve bağlantılarla değiştirilir. Dashboard sayaçları tek SQL; listeler 20 kayıtlık pagination ile tek SQL; ikincil admin seçenekleri istemcide sonradan yüklenir. Session sayısı artırılmaz. Bakiye özetleri aggregate SQL kullanır. İlgili owner/department/assignee/status/approver/history/ledger indexleri bulunur.

Testler PGlite PostgreSQL üzerinde gerçek migration/SQL/transaction/trigger ve mevcut RBAC ile çalışır. Preview'a test personeli veya iş kaydı eklenmez. Yeni faza geçilmez.
