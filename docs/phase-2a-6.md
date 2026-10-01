# Phase 2A-6 — Ajanda ve toplantı odaları

Ajanda, currentUser için mevcut `event_participants + events`, tamamen onaylı `leave_requests` ve `meeting_reservations` kayıtlarının SQL UNION projection'ıdır. CalendarEvent kopyası yoktur. Etkinlik katılımı, güncel hedef kitle ve kaynak permission kontrolleri korunur. İptal rezervasyon ve bekleyen/reddedilmiş izinler görünmez. Çok günlük izin tarih aralığıyla, yarım gün sabah/öğleden sonra etiketiyle gösterilir.

Migration `007_meetings.sql`: `meeting_rooms`, `meeting_reservations`. Özellikler basit JSON array; şirket mevcut Location üzerinden alınır. Rezervasyon geçmişi olan odanın lokasyonu servis seviyesinde değiştirilemez. İptal soft state'dir; reservation hard delete ve final durum değiştirme trigger ile engellenir. Bitmiş aktif rezervasyonlar saat üzerinden Tamamlandı olarak gösterilir, cron gerekmez.

PostgreSQL `btree_gist` extension + `meeting_no_overlap` exclusion constraint, aynı oda için aktif `[start_at,end_at)` aralıklarının çakışmasını tüm transaction isolation seviyelerinde engeller. Yan yana aralıklar geçerlidir; iptal edilenler kısıttan çıkar. Mevcut transaction/app_lock ve mutation sırasında taze identity/permission kontrolleri kullanılır. UI uygunluk sonucu rezervasyon garantisi değildir; kayıt sırasında tekrar kontrol edilir ve DB son korumadır.

Saatler UI'da oda lokasyonunun IANA timezone'unda girilir. PostgreSQL yerel timestamp'i timestamptz'e çevirir; DB UTC anlarını tutar. Türkiye Europe/Istanbul. DST olmayan/belirsiz saatleri rezervasyonda reddeder. Kullanıcının ajandası kendi lokasyon timezone'unda görüntülenir. Geçmiş zaman, başlangıç>=bitiş ve aşırı süre server'da reddedilir. Opsiyonel `MEETING_MAX_HOURS` environment variable varsayılan 8 saat; zorunlu yeni environment variable yoktur.

Portal: `/calendar`, `/meeting-rooms`, `/meeting-rooms/new`, `/meeting-rooms/my-reservations`, `/meeting-rooms/my-reservations/[id]`.
Admin: `/admin/meeting-rooms`, `/admin/meeting-rooms/new`, `/admin/meeting-rooms/[id]`, `/admin/meeting-reservations`.
API: `/api/meetings/[[...path]]` altında agenda/options/rooms/reservations. Current user sunucudan; başkasının kişisel ajanda/rezervasyonuna ID veya filtreyle erişim engellenir. Yetkili admin listeleyip gelecekteki rezervasyonu iptal edebilir, başkasının rezervasyonunu düzenleyen kapsam eklenmez.

Permission'lar: `calendar.view_own`, `meeting_rooms.view`, `meeting_rooms.manage`, `meeting_reservations.view_own`, `meeting_reservations.create`, `meeting_reservations.edit_own`, `meeting_reservations.cancel_own`, `meeting_reservations.manage`. Çalışan kendi işlem yetkilerini, ADMIN/SUPER_ADMIN tümünü alır. Yönetim permission'ları tek başına ilgili admin route'una yeterlidir. Kullanıcı override ve sonradan kaldırılan rol izinleri korunur.

Mevcut Notification foundation kullanılır: rezervasyon oluşturma organizatöre; başka yönetici tarafından iptal organizatöre. Business action/audit/notification aynı transaction; `meeting.created:<id>` ve `meeting.admin_cancelled:<id>` dedup key'leri. Düzenleme spam üretmez. E-mail/SMS/push/cron yoktur.

Dashboard Ajandam mevcut tasarımını korur; SSR yalnız bugünü tek bounded SQL'de çeker, ilk hydration'da aynı sorgu tekrarlanmaz. Seçilen gün değişince sadece o gün yenilenir. `/calendar` yalnız ilgili ayı tek sorguda alır. Her kaynak kendi owner/audience kapsamındadır. Availability oda başına sorgu yerine tek NOT EXISTS sorgusudur. Oda ve rezervasyon listeleri 20 kayıtla sayfalanır; filtre seçenekleri kritik render sonrası gelir. Owner/time, room/time/status, location ve agenda katılım/izin indexleri mevcuttur. Yeni navigasyon Link/router kullanır; yeni session sorgusu eklenmez.

Testler izole PGlite PostgreSQL + btree_gist üzerinde çalışır. Eşzamanlı gönderilen SQL yazılarında tek kazanan ve doğrudan SQL bypass engeli doğrulanır; PGlite tek bağlantı kullandığından bu test iki bağımsız Neon bağlantısının yük testi değildir. Çok bağlantılı yarış güvenliği PostgreSQL exclusion constraint tarafından sağlanır. Preview'a sahte oda/rezervasyon/çalışan eklenmez. MASTER'ın diğer kartları ve Phase 2A-1/2/3/4/5 servisleri yeniden yazılmaz.
