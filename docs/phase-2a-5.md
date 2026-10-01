# Phase 2A-5 — Öneriler ve portal bildirimleri

Mevcut `workflow_notifications` tablosu genişletilir; ikinci bildirim sistemi, servis, cron veya dış mesaj gönderimi yoktur. Migration `006_engagement.sql`, mevcut Vercel migration sürecinden çalışır. Yeni environment variable gerekmez.

Öneri türleri `suggestion_types` tablosunda beş başlangıç kaydıdır. `suggestions` owner/organizasyon snapshot, durum ve opsiyonel tek eki taşır. Ek sınırı mevcut storage yaklaşımıyla aynı DB'de 200 KB PDF/PNG/JPEG/WebP'dir; dosya imzası ve boyutu doğrulanır. Liste sorguları dosya içeriğini çekmez. `suggestion_status_history` ve `suggestion_responses` append-only trigger ile korunur. Anonim gönderim yoktur.

Portal: `/suggestions`, `/suggestions/new`, `/suggestions/[id]`, `/notifications`.
Admin: `/admin/suggestions`, `/admin/suggestions/[id]`.
API: `/api/suggestions/[[...path]]`, `/api/notifications/[[...path]]`.
Permission: `suggestions.view_own`, `suggestions.create`, `suggestions.manage`, `notifications.view_own`. Çalışan rolleri kendi kayıt/bildirim yetkilerini alır; ADMIN, SUPER_ADMIN, CONTENT_ADMIN öneri yönetebilir. Özel rol/override ile `suggestions.manage` verilmesi öneri admin rotası için yeterlidir; başka admin modüllerini açmaz. Seed, sonradan kaldırılan yetkiyi geri vermez.

Bildirimler: atanmış yönetici/İK onayı; yönetici ara onayı ve nihai izin onayı ayrı mesajlar; izin red; yetkili departmana ulaşan talep; sorumlu atama; inceleme/işlem/tamamlama/red; zimmet atama/iade; öneri inceleme/yanıt/kapatma/red; önemli/acil duyuru ve yayınlanan etkinlik. Duyuru/etkinlik fanout tek SQL'dir; mevcut OR-hedef kitle ve role/user override kuralları uygulanır. Normal duyuru bildirim üretmez. İleri tarihli içerik için scheduler kurulmaz; bildirimi ancak yayın/save aksiyonu anında gerçekten erişilebilir içerik üretir. Eski içerikleri herkese yeniden gönderen backfill yoktur. Mevcut foundation bildirimleri aynı satırda başlık/link ile zenginleştirilir.

Bildirimler business transaction içinde aynı PostgreSQL'e yazılır; ağ servisi veya kuyruk gerektirmez. `(recipient_id,dedup_key)` unique index tekrarı yok sayar. Onay için approval ID/stage; yayın için içerik ID; zimmet için atama ID; öneri durum hareketi için history ID; yanıt için istemci idempotency UUID kullanılır. Aynı yanıt retry'ı ikinci yanıt/history/notification yaratmaz. Aynı durum ve aynı sorumlu tekrarında yeni bildirim üretilmez. Yeniden başka sorumluya gerçek atama ayrı olaydır.

Öneri oluşturma/yönetme mevcut global transaction lock ve mutation sırasında taze RBAC kontrolünü kullanır. Owner/admin sınırları API ve server sayfasında uygulanır. Bildirim okundu işlemi yalnız currentUser kayıtlarını günceller, audit'e küçük okuma hareketleri yazılmaz. Bildirim bağlantısı sınırlı iç rotadır; hedef route kendi authorization'ını yeniden uygular. Bildirim almış olmak içerik izni sağlamaz.

Dashboard tasarımı korunur. Demo öneriler yerine currentUser'ın iki sekmede son ikişer kaydı ve gerçek toplamlar gösterilir. Dashboard engagement verisi tek SQL'de özetlenir; mevcut sorgularla paralel çalışır, session yeniden okunmaz. Bell başlangıçta bildirim listesini çekmez. Dropdown açılınca tek SQL'de son 8 ve güncel okunmamış sayı gelir. Zil/center okuma aksiyonları anında güncellenir; polling/push yoktur. Öneri ve notification center listeleri 20'şer kayıtla sayfalanır. Owner/status/createdAt ve recipient/createdAt/unread indexleri eklenmiştir; admin filtre seçenekleri ana liste sonrası yüklenir.

Testler gerçek PostgreSQL davranışı sağlayan PGlite ile schema/transaction/trigger, mevcut auth/RBAC ve modül servisleri üzerinden çalışır. Preview'a sahte çalışan, iş kaydı, öneri veya bildirim eklenmez. Phase 2A-6 kapsam dışıdır.
