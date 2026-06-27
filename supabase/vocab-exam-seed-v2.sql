-- BIPA 模拟测评题库 v2（扩充版）
-- 先清空旧数据再插入：
-- DELETE FROM public.vocab_exam_bank;
-- 然后执行本文件。

insert into public.vocab_exam_bank (section, difficulty, prompt, options, answer, explain, passage_title, passage_text, sort_order, active) values

-- ============================================================
-- WORD · easy（12 题 — 饮食/家庭/身体/自然/问候）
-- ============================================================
  ('word', 'easy', 'Kata "nasi" berarti ...', '["米饭","蛋糕","面条","面包"]'::jsonb, '米饭', 'nasi = 米饭，印尼主食', null, null, 1, true),
  ('word', 'easy', 'Kata "ayam" berarti ...', '["鸭","鸡","牛","鱼"]'::jsonb, '鸡', 'ayam = 鸡', null, null, 2, true),
  ('word', 'easy', 'Kata "ibu" berarti ...', '["姐姐","奶奶","妈妈","父亲"]'::jsonb, '妈妈', 'ibu = 妈妈/母亲，也用作尊称', null, null, 3, true),
  ('word', 'easy', 'Kata "adik" berarti ...', '["叔叔","阿姨","哥哥/姐姐","弟弟/妹妹"]'::jsonb, '弟弟/妹妹', 'adik = 弟弟或妹妹（不分性别的弟妹）', null, null, 4, true),
  ('word', 'easy', 'Kata "kepala" berarti ...', '["头","脚","手","肩膀"]'::jsonb, '头', 'kepala = 头', null, null, 5, true),
  ('word', 'easy', 'Kata "mata" berarti ...', '["耳朵","眼睛","嘴巴","鼻子"]'::jsonb, '眼睛', 'mata = 眼睛', null, null, 6, true),
  ('word', 'easy', 'Kata "bunga" berarti ...', '["草","果实","花","树"]'::jsonb, '花', 'bunga = 花', null, null, 7, true),
  ('word', 'easy', 'Kata "hujan" berarti ...', '["雪","云","风","雨"]'::jsonb, '雨', 'hujan = 雨', null, null, 8, true),
  ('word', 'easy', 'Kata "terima kasih" berarti ...', '["谢谢","你好","再见","对不起"]'::jsonb, '谢谢', 'terima kasih = 谢谢', null, null, 9, true),
  ('word', 'easy', 'Kata "selamat pagi" berarti ...', '["下午好","早上好","晚安","再见"]'::jsonb, '早上好', 'selamat pagi = 早上好', null, null, 10, true),
  ('word', 'easy', 'Kata "sayur" berarti ...', '["水果","肉","蔬菜","米饭"]'::jsonb, '蔬菜', 'sayur = 蔬菜', null, null, 11, true),
  ('word', 'easy', 'Kata "kakak" berarti ...', '["孙子","妹妹","弟弟","哥哥/姐姐"]'::jsonb, '哥哥/姐姐', 'kakak = 哥哥或姐姐（不分性别的兄姐）', null, null, 12, true),

-- ============================================================
-- WORD · medium（12 题 — 旅行/购物/健康/工作）
-- ============================================================
  ('word', 'medium', 'Kata "bandara" berarti ...', '["机场","港口","火车站","汽车站"]'::jsonb, '机场', 'bandara = 机场（bandar udara 的缩写）', null, null, 1, true),
  ('word', 'medium', 'Kata "penginapan" berarti ...', '["车站","住宿","景点","餐厅"]'::jsonb, '住宿', 'penginapan = 住宿/旅馆', null, null, 2, true),
  ('word', 'medium', 'Kata "diskon" berarti ...', '["税收","罚款","折扣","小费"]'::jsonb, '折扣', 'diskon = 折扣', null, null, 3, true),
  ('word', 'medium', 'Kata "kembalian" berarti ...', '["收据","购物袋","货架","找零"]'::jsonb, '找零', 'kembalian = 找零/找回的钱', null, null, 4, true),
  ('word', 'medium', 'Kata "demam" berarti ...', '["发烧","头痛","感冒","咳嗽"]'::jsonb, '发烧', 'demam = 发烧', null, null, 5, true),
  ('word', 'medium', 'Kata "obat" berarti ...', '["维生素","药","食物","饮料"]'::jsonb, '药', 'obat = 药/药品', null, null, 6, true),
  ('word', 'medium', 'Kata "gaji" berarti ...', '["贷款","罚款","工资","奖金"]'::jsonb, '工资', 'gaji = 工资/薪水', null, null, 7, true),
  ('word', 'medium', 'Kata "rapat" berarti ...', '["午餐","培训","假期","会议"]'::jsonb, '会议', 'rapat = 会议', null, null, 8, true),
  ('word', 'medium', 'Kata "paspor" berarti ...', '["护照","签证","行李","机票"]'::jsonb, '护照', 'paspor = 护照', null, null, 9, true),
  ('word', 'medium', 'Kata "belanja" berarti ...', '["休息","购物","工作","旅行"]'::jsonb, '购物', 'belanja = 购物', null, null, 10, true),
  ('word', 'medium', 'Kata "apotek" berarti ...', '["诊所","医院","药店","实验室"]'::jsonb, '药店', 'apotek = 药店/药房', null, null, 11, true),
  ('word', 'medium', 'Kata "karyawan" berarti ...', '["经理","老板","客户","员工"]'::jsonb, '员工', 'karyawan = 员工/职员', null, null, 12, true),

-- ============================================================
-- WORD · hard（12 题 — 政治/经济/抽象概念/正式印尼语）
-- ============================================================
  ('word', 'hard', 'Kata "anggaran" berarti ...', '["预算","利润","投资","债务"]'::jsonb, '预算', 'anggaran = 预算', null, null, 1, true),
  ('word', 'hard', 'Kata "pemilu" berarti ...', '["议会","选举","法律","政策"]'::jsonb, '选举', 'pemilu = 选举（pemilihan umum 的缩写）', null, null, 2, true),
  ('word', 'hard', 'Kata "inflasi" berarti ...', '["贸易顺差","经济衰退","通货膨胀","汇率"]'::jsonb, '通货膨胀', 'inflasi = 通货膨胀', null, null, 3, true),
  ('word', 'hard', 'Kata "kedaulatan" berarti ...', '["条约","合作","外交","主权"]'::jsonb, '主权', 'kedaulatan = 主权/sovereignty', null, null, 4, true),
  ('word', 'hard', 'Kata "berwenang" berarti ...', '["有权/有职权","参与","反对","负责"]'::jsonb, '有权/有职权', 'berwenang = 有权/有职权', null, null, 5, true),
  ('word', 'hard', 'Kata "kesejahteraan" berarti ...', '["就业","福利/福祉","安全","教育"]'::jsonb, '福利/福祉', 'kesejahteraan = 福利/福祉', null, null, 6, true),
  ('word', 'hard', 'Kata "korupsi" berarti ...', '["垄断","贿赂","腐败","犯罪"]'::jsonb, '腐败', 'korupsi = 腐败/贪腐', null, null, 7, true),
  ('word', 'hard', 'Kata "perundang-undangan" berarti ...', '["宪法","起诉","判决","法律法规"]'::jsonb, '法律法规', 'perundang-undangan = 法律法规/立法', null, null, 8, true),
  ('word', 'hard', 'Kata "berkelanjutan" berarti ...', '["可持续的","临时的","传统的","紧急的"]'::jsonb, '可持续的', 'berkelanjutan = 可持续的', null, null, 9, true),
  ('word', 'hard', 'Kata "paradigma" berarti ...', '["理论","范式","假设","矛盾"]'::jsonb, '范式', 'paradigma = 范式/典范', null, null, 10, true),
  ('word', 'hard', 'Kata "implementasi" berarti ...', '["修订","计划","实施","评估"]'::jsonb, '实施', 'implementasi = 实施/落实', null, null, 11, true),
  ('word', 'hard', 'Kata "disparitas" berarti ...', '["增长","合并","平衡","差距"]'::jsonb, '差距', 'disparitas = 差距/不平等', null, null, 12, true),

-- ============================================================
-- SENTENCE · easy（12 题 — 填空/日常简单句）
-- ============================================================
  ('sentence', 'easy', 'Saya ___ nasi goreng setiap pagi.', '["makan","menulis","membaca","menari"]'::jsonb, 'makan', 'makan nasi goreng = 吃炒饭', null, null, 1, true),
  ('sentence', 'easy', 'Ayah ___ koran di ruang tamu.', '["mencuci","membaca","memasak","menyapu"]'::jsonb, 'membaca', 'membaca koran = 读报纸', null, null, 2, true),
  ('sentence', 'easy', 'Anak-anak ___ di taman setiap sore.', '["tidur","belajar","bermain","bekerja"]'::jsonb, 'bermain', 'bermain di taman = 在公园玩', null, null, 3, true),
  ('sentence', 'easy', 'Ibu membeli ___ di pasar.', '["tas","sepatu","buku","ikan"]'::jsonb, 'ikan', 'membeli ikan di pasar = 在市场买鱼，最合语境', null, null, 4, true),
  ('sentence', 'easy', 'Saya tinggal di ___ yang kecil.', '["rumah","mobil","piring","kursi"]'::jsonb, 'rumah', 'tinggal di rumah = 住在房子里', null, null, 5, true),
  ('sentence', 'easy', 'Dia pergi ke ___ untuk membeli obat.', '["perpustakaan","apotek","bioskop","stadion"]'::jsonb, 'apotek', 'apotek = 药店，买药去药店', null, null, 6, true),
  ('sentence', 'easy', 'Kakak saya ___ di universitas.', '["memasak","berenang","belajar","bernyanyi"]'::jsonb, 'belajar', 'belajar di universitas = 在大学学习', null, null, 7, true),
  ('sentence', 'easy', 'Kucing itu ___ di atas meja.', '["berenang","menulis","terbang","tidur"]'::jsonb, 'tidur', 'kucing tidur = 猫在睡觉', null, null, 8, true),
  ('sentence', 'easy', 'Setiap pagi saya ___ gigi.', '["menggosok","menarik","mewarnai","memotong"]'::jsonb, 'menggosok', 'menggosok gigi = 刷牙', null, null, 9, true),
  ('sentence', 'easy', 'Kami ___ ke sekolah naik sepeda.', '["pulang","pergi","tiba","datang"]'::jsonb, 'pergi', 'pergi ke sekolah = 去学校，naik sepeda = 骑自行车', null, null, 10, true),
  ('sentence', 'easy', 'Tolong ___ pintu itu.', '["tulis","tanam","tutup","ambil"]'::jsonb, 'tutup', 'tolong tutup pintu = 请关门', null, null, 11, true),
  ('sentence', 'easy', 'Adik suka minum ___ dingin.', '["nasi","roti","sayur","air"]'::jsonb, 'air', 'minum air dingin = 喝冷水', null, null, 12, true),

-- ============================================================
-- SENTENCE · medium（12 题 — 连词/时态/比较级）
-- ============================================================
  ('sentence', 'medium', 'Dia tidak datang ___ sedang sakit.', '["karena","dan","atau","tetapi"]'::jsonb, 'karena', 'karena = 因为，表示原因', null, null, 1, true),
  ('sentence', 'medium', 'Saya sudah ___ makan sebelum kamu datang.', '["mulai","selesai","coba","lupa"]'::jsonb, 'selesai', 'sudah selesai makan = 已经吃完了', null, null, 2, true),
  ('sentence', 'medium', 'Rumah ini lebih ___ daripada rumah itu.', '["jauh","dekat","besar","mahal"]'::jsonb, 'besar', 'lebih besar daripada = 比……更大', null, null, 3, true),
  ('sentence', 'medium', 'Walaupun hujan, mereka ___ pergi ke sekolah.', '["belum","jarang","tidak","tetap"]'::jsonb, 'tetap', 'walaupun ... tetap = 尽管……仍然', null, null, 4, true),
  ('sentence', 'medium', 'Ibu memasak ___ ayah mencuci piring.', '["sementara","karena","supaya","sebelum"]'::jsonb, 'sementara', 'sementara = 与此同时/当……的时候', null, null, 5, true),
  ('sentence', 'medium', 'Film ini ___ menarik daripada film kemarin.', '["paling","lebih","sangat","cukup"]'::jsonb, 'lebih', 'lebih ... daripada = 比……更……', null, null, 6, true),
  ('sentence', 'medium', 'Saya akan ___ ke Bali minggu depan.', '["berbelanja","bertemu","berlibur","berdiri"]'::jsonb, 'berlibur', 'akan berlibur = 将要去度假', null, null, 7, true),
  ('sentence', 'medium', 'Dia belajar keras ___ lulus ujian.', '["namun","meskipun","tetapi","supaya"]'::jsonb, 'supaya', 'supaya = 为了/以便', null, null, 8, true),
  ('sentence', 'medium', 'Harga barang-barang ___ naik akhir-akhir ini.', '["terus","belum","pernah","baru"]'::jsonb, 'terus', 'terus naik = 持续上涨', null, null, 9, true),
  ('sentence', 'medium', '___ kamu sudah makan, kita bisa berangkat.', '["Meskipun","Kalau","Namun","Tetapi"]'::jsonb, 'Kalau', 'kalau = 如果/要是', null, null, 10, true),
  ('sentence', 'medium', 'Gedung ini adalah yang ___ tinggi di kota kami.', '["cukup","agak","paling","lebih"]'::jsonb, 'paling', 'paling tinggi = 最高的（最高级）', null, null, 11, true),
  ('sentence', 'medium', 'Kami belum ___ ke tempat itu sebelumnya.', '["sering","selalu","sudah","pernah"]'::jsonb, 'pernah', 'belum pernah = 从未/还没有……过', null, null, 12, true),

-- ============================================================
-- SENTENCE · hard（12 题 — 正式语言/新闻体/复杂从句）
-- ============================================================
  ('sentence', 'hard', 'Pemerintah ___ langkah-langkah strategis untuk mengatasi kemiskinan.', '["mengambil","membuang","menghilangkan","menyimpan"]'::jsonb, 'mengambil', 'mengambil langkah = 采取措施（固定搭配）', null, null, 1, true),
  ('sentence', 'hard', 'Berdasarkan data BPS, angka pengangguran ___ sebesar 2% tahun ini.', '["menghilang","menurun","meningkat","bertambah"]'::jsonb, 'menurun', 'menurun sebesar 2% = 下降了2%', null, null, 2, true),
  ('sentence', 'hard', 'Undang-undang tersebut ___ setelah melalui pembahasan yang panjang.', '["dihapus","diabaikan","disahkan","ditolak"]'::jsonb, 'disahkan', 'disahkan = 被批准/通过（被动语态 di-kan）', null, null, 3, true),
  ('sentence', 'hard', 'Para ahli ___ bahwa perubahan iklim akan berdampak serius pada sektor pertanian.', '["membantah","meragukan","mengabaikan","memperingatkan"]'::jsonb, 'memperingatkan', 'memperingatkan = 警告', null, null, 4, true),
  ('sentence', 'hard', 'Investasi asing ___ peran penting dalam pertumbuhan ekonomi nasional.', '["memainkan","membuang","menghentikan","menghapus"]'::jsonb, 'memainkan', 'memainkan peran = 发挥作用（固定搭配）', null, null, 5, true),
  ('sentence', 'hard', 'Hasil penelitian ini ___ dengan temuan studi sebelumnya.', '["berbeda","sejalan","bertentangan","bermasalah"]'::jsonb, 'sejalan', 'sejalan dengan = 与……一致/吻合', null, null, 6, true),
  ('sentence', 'hard', 'Masyarakat diimbau untuk ___ protokol kesehatan selama pandemi.', '["mengabaikan","melanggar","mematuhi","menentang"]'::jsonb, 'mematuhi', 'mematuhi = 遵守（me-i 词缀）', null, null, 7, true),
  ('sentence', 'hard', 'Proyek infrastruktur itu ___ dampak positif bagi masyarakat sekitar.', '["mencegah","mengurangi","membatalkan","memberikan"]'::jsonb, 'memberikan', 'memberikan dampak = 产生影响', null, null, 8, true),
  ('sentence', 'hard', 'Kerja sama bilateral kedua negara ___ di berbagai bidang.', '["diperkuat","dilemahkan","dibatalkan","dikurangi"]'::jsonb, 'diperkuat', 'diperkuat = 被加强（di-per-kuat 被动）', null, null, 9, true),
  ('sentence', 'hard', 'Menteri menegaskan bahwa reformasi birokrasi harus ___ secara bertahap.', '["diabaikan","dilaksanakan","ditunda","dihentikan"]'::jsonb, 'dilaksanakan', 'dilaksanakan secara bertahap = 分阶段实施', null, null, 10, true),
  ('sentence', 'hard', 'Tingginya angka urbanisasi ___ tekanan besar terhadap infrastruktur perkotaan.', '["menyederhanakan","menghilangkan","menimbulkan","menurunkan"]'::jsonb, 'menimbulkan', 'menimbulkan tekanan = 造成/引起压力', null, null, 11, true),
  ('sentence', 'hard', 'Kebijakan fiskal yang ___ diperlukan untuk menjaga stabilitas ekonomi.', '["sempit","longgar","lemah","prudent"]'::jsonb, 'prudent', 'prudent（审慎的）是印尼经济新闻中常用的借词（kebijakan fiskal yang prudent = 审慎的财政政策）', null, null, 12, true),

-- ============================================================
-- READING · easy · 篇章 1：Di Warung Makan（在小吃店）
-- ============================================================
  ('reading', 'easy', 'Siti dan Rina makan siang di mana?', '["di warung dekat kantor","di kantor","di rumah","di restoran mewah"]'::jsonb, 'di warung dekat kantor', '文中说 pergi ke warung dekat kantor = 去办公室附近的小吃店', 'Di Warung Makan', 'Siti dan Rina bekerja di kantor yang sama. Setiap hari Jumat, mereka pergi ke warung dekat kantor untuk makan siang. Siti biasanya memesan nasi ayam, sedangkan Rina lebih suka mie goreng. Setelah makan, mereka minum es teh dan mengobrol sebentar sebelum kembali bekerja.', 1, true),
  ('reading', 'easy', 'Apa makanan favorit Rina?', '["nasi goreng","mie goreng","nasi ayam","soto"]'::jsonb, 'mie goreng', '文中说 Rina lebih suka mie goreng', 'Di Warung Makan', 'Siti dan Rina bekerja di kantor yang sama. Setiap hari Jumat, mereka pergi ke warung dekat kantor untuk makan siang. Siti biasanya memesan nasi ayam, sedangkan Rina lebih suka mie goreng. Setelah makan, mereka minum es teh dan mengobrol sebentar sebelum kembali bekerja.', 2, true),
  ('reading', 'easy', 'Mereka pergi ke warung pada hari apa?', '["Rabu","Senin","Jumat","Sabtu"]'::jsonb, 'Jumat', '文中说 setiap hari Jumat = 每个星期五', 'Di Warung Makan', 'Siti dan Rina bekerja di kantor yang sama. Setiap hari Jumat, mereka pergi ke warung dekat kantor untuk makan siang. Siti biasanya memesan nasi ayam, sedangkan Rina lebih suka mie goreng. Setelah makan, mereka minum es teh dan mengobrol sebentar sebelum kembali bekerja.', 3, true),
  ('reading', 'easy', 'Setelah makan, mereka minum apa?', '["kopi","jus jeruk","susu","es teh"]'::jsonb, 'es teh', '文中说 minum es teh = 喝冰茶', 'Di Warung Makan', 'Siti dan Rina bekerja di kantor yang sama. Setiap hari Jumat, mereka pergi ke warung dekat kantor untuk makan siang. Siti biasanya memesan nasi ayam, sedangkan Rina lebih suka mie goreng. Setelah makan, mereka minum es teh dan mengobrol sebentar sebelum kembali bekerja.', 4, true),

-- ============================================================
-- READING · easy · 篇章 2：Pagi di Desa（乡村的早晨）
-- ============================================================
  ('reading', 'easy', 'Pak Adi bangun jam berapa?', '["jam lima","jam enam","jam empat","jam tujuh"]'::jsonb, 'jam lima', '文中说 bangun jam lima pagi = 早上五点起床', 'Pagi di Desa', 'Pak Adi tinggal di sebuah desa kecil di Jawa Tengah. Setiap hari ia bangun jam lima pagi. Setelah salat subuh, ia pergi ke sawah untuk menanam padi. Istrinya, Bu Adi, tinggal di rumah dan menyiapkan sarapan untuk anak-anak sebelum mereka berangkat ke sekolah.', 1, true),
  ('reading', 'easy', 'Pak Adi tinggal di mana?', '["di Jakarta","di desa kecil di Jawa Tengah","di Bali","di kota besar"]'::jsonb, 'di desa kecil di Jawa Tengah', '文中第一句即说明地点', 'Pagi di Desa', 'Pak Adi tinggal di sebuah desa kecil di Jawa Tengah. Setiap hari ia bangun jam lima pagi. Setelah salat subuh, ia pergi ke sawah untuk menanam padi. Istrinya, Bu Adi, tinggal di rumah dan menyiapkan sarapan untuk anak-anak sebelum mereka berangkat ke sekolah.', 2, true),
  ('reading', 'easy', 'Apa yang dilakukan Pak Adi di sawah?', '["berolahraga","berjualan","menanam padi","memancing"]'::jsonb, 'menanam padi', '文中说 pergi ke sawah untuk menanam padi = 去稻田种水稻', 'Pagi di Desa', 'Pak Adi tinggal di sebuah desa kecil di Jawa Tengah. Setiap hari ia bangun jam lima pagi. Setelah salat subuh, ia pergi ke sawah untuk menanam padi. Istrinya, Bu Adi, tinggal di rumah dan menyiapkan sarapan untuk anak-anak sebelum mereka berangkat ke sekolah.', 3, true),
  ('reading', 'easy', 'Bu Adi menyiapkan apa untuk anak-anak?', '["makan siang","makan malam","bekal","sarapan"]'::jsonb, 'sarapan', '文中说 menyiapkan sarapan = 准备早餐', 'Pagi di Desa', 'Pak Adi tinggal di sebuah desa kecil di Jawa Tengah. Setiap hari ia bangun jam lima pagi. Setelah salat subuh, ia pergi ke sawah untuk menanam padi. Istrinya, Bu Adi, tinggal di rumah dan menyiapkan sarapan untuk anak-anak sebelum mereka berangkat ke sekolah.', 4, true),

-- ============================================================
-- READING · medium · 篇章 1：Wisata di Yogyakarta（日惹旅游）
-- ============================================================
  ('reading', 'medium', 'Dari mana keluarga Dani berangkat?', '["Jakarta","Bandung","Surabaya","Semarang"]'::jsonb, 'Jakarta', '文中说 berangkat dari Jakarta = 从雅加达出发', 'Wisata di Yogyakarta', 'Keluarga Dani berlibur ke Yogyakarta selama tiga hari. Mereka berangkat dari Jakarta dengan kereta api. Di hari pertama, mereka mengunjungi Candi Prambanan dan belajar tentang sejarah Hindu di Jawa. Hari kedua, mereka mencoba berbagai makanan khas seperti gudeg dan bakpia. Di hari terakhir, mereka berbelanja batik di Malioboro sebelum pulang.', 1, true),
  ('reading', 'medium', 'Berapa lama mereka berlibur?', '["seminggu","tiga hari","lima hari","dua hari"]'::jsonb, 'tiga hari', '文中说 selama tiga hari = 三天', 'Wisata di Yogyakarta', 'Keluarga Dani berlibur ke Yogyakarta selama tiga hari. Mereka berangkat dari Jakarta dengan kereta api. Di hari pertama, mereka mengunjungi Candi Prambanan dan belajar tentang sejarah Hindu di Jawa. Hari kedua, mereka mencoba berbagai makanan khas seperti gudeg dan bakpia. Di hari terakhir, mereka berbelanja batik di Malioboro sebelum pulang.', 2, true),
  ('reading', 'medium', 'Apa yang mereka lakukan di hari pertama?', '["berenang di pantai","berbelanja batik","mengunjungi Candi Prambanan","mencoba makanan khas"]'::jsonb, 'mengunjungi Candi Prambanan', '文中说 hari pertama mengunjungi Candi Prambanan', 'Wisata di Yogyakarta', 'Keluarga Dani berlibur ke Yogyakarta selama tiga hari. Mereka berangkat dari Jakarta dengan kereta api. Di hari pertama, mereka mengunjungi Candi Prambanan dan belajar tentang sejarah Hindu di Jawa. Hari kedua, mereka mencoba berbagai makanan khas seperti gudeg dan bakpia. Di hari terakhir, mereka berbelanja batik di Malioboro sebelum pulang.', 3, true),
  ('reading', 'medium', 'Di hari terakhir, mereka berbelanja di mana?', '["Kuta","Tanah Abang","Pasar Beringharjo","Malioboro"]'::jsonb, 'Malioboro', '文中说 berbelanja batik di Malioboro', 'Wisata di Yogyakarta', 'Keluarga Dani berlibur ke Yogyakarta selama tiga hari. Mereka berangkat dari Jakarta dengan kereta api. Di hari pertama, mereka mengunjungi Candi Prambanan dan belajar tentang sejarah Hindu di Jawa. Hari kedua, mereka mencoba berbagai makanan khas seperti gudeg dan bakpia. Di hari terakhir, mereka berbelanja batik di Malioboro sebelum pulang.', 4, true),

-- ============================================================
-- READING · medium · 篇章 2：Belajar Memasak（学做菜）
-- ============================================================
  ('reading', 'medium', 'Dari mana Maya belajar resep baru?', '["dari internet","dari televisi","dari buku masak","dari ibunya"]'::jsonb, 'dari internet', '文中说 mencari resep baru dari internet = 从网上找新食谱', 'Belajar Memasak', 'Maya suka memasak sejak kecil. Sekarang, ia sering mencari resep baru dari internet. Minggu lalu, ia mencoba membuat rendang untuk pertama kalinya. Meskipun prosesnya lama, hasilnya sangat enak. Teman-temannya yang mencicipi rendang itu memuji masakannya dan meminta resepnya.', 1, true),
  ('reading', 'medium', 'Masakan apa yang Maya coba buat minggu lalu?', '["sate","rendang","gado-gado","soto"]'::jsonb, 'rendang', '文中说 mencoba membuat rendang', 'Belajar Memasak', 'Maya suka memasak sejak kecil. Sekarang, ia sering mencari resep baru dari internet. Minggu lalu, ia mencoba membuat rendang untuk pertama kalinya. Meskipun prosesnya lama, hasilnya sangat enak. Teman-temannya yang mencicipi rendang itu memuji masakannya dan meminta resepnya.', 2, true),
  ('reading', 'medium', 'Bagaimana proses membuat rendang menurut teks?', '["gagal total","biasa saja","lama tapi hasilnya enak","cepat dan mudah"]'::jsonb, 'lama tapi hasilnya enak', '文中说 prosesnya lama, hasilnya sangat enak = 过程长但结果很好吃', 'Belajar Memasak', 'Maya suka memasak sejak kecil. Sekarang, ia sering mencari resep baru dari internet. Minggu lalu, ia mencoba membuat rendang untuk pertama kalinya. Meskipun prosesnya lama, hasilnya sangat enak. Teman-temannya yang mencicipi rendang itu memuji masakannya dan meminta resepnya.', 3, true),
  ('reading', 'medium', 'Apa reaksi teman-teman Maya?', '["mereka membeli di restoran","mereka tidak mencicipi","mereka tidak suka","mereka memuji dan meminta resepnya"]'::jsonb, 'mereka memuji dan meminta resepnya', '文中说 memuji masakannya dan meminta resepnya = 称赞并要了食谱', 'Belajar Memasak', 'Maya suka memasak sejak kecil. Sekarang, ia sering mencari resep baru dari internet. Minggu lalu, ia mencoba membuat rendang untuk pertama kalinya. Meskipun prosesnya lama, hasilnya sangat enak. Teman-temannya yang mencicipi rendang itu memuji masakannya dan meminta resepnya.', 4, true),

-- ============================================================
-- READING · hard · 篇章 1：Transisi Energi di Indonesia（印尼能源转型）
-- ============================================================
  ('reading', 'hard', 'Apa tantangan utama transisi energi di Indonesia menurut teks?', '["ketergantungan tinggi pada batu bara","harga minyak dunia","kurangnya tenaga kerja","kurangnya lahan"]'::jsonb, 'ketergantungan tinggi pada batu bara', '文中说 tantangan utamanya adalah ketergantungan yang masih tinggi pada batu bara = 主要挑战是对煤炭的高度依赖', 'Transisi Energi di Indonesia', 'Indonesia berkomitmen untuk mencapai target nol emisi karbon pada tahun 2060. Pemerintah telah merancang peta jalan transisi energi yang mencakup pengembangan energi surya, angin, dan panas bumi. Namun, tantangan utamanya adalah ketergantungan yang masih tinggi pada batu bara sebagai sumber listrik utama. Para pakar menekankan pentingnya investasi dalam teknologi penyimpanan energi serta kebijakan insentif bagi industri energi terbarukan. Tanpa langkah konkret, target tersebut akan sulit tercapai.', 1, true),
  ('reading', 'hard', 'Kapan target nol emisi karbon Indonesia?', '["2030","2060","2050","2045"]'::jsonb, '2060', '文中明确写了 tahun 2060', 'Transisi Energi di Indonesia', 'Indonesia berkomitmen untuk mencapai target nol emisi karbon pada tahun 2060. Pemerintah telah merancang peta jalan transisi energi yang mencakup pengembangan energi surya, angin, dan panas bumi. Namun, tantangan utamanya adalah ketergantungan yang masih tinggi pada batu bara sebagai sumber listrik utama. Para pakar menekankan pentingnya investasi dalam teknologi penyimpanan energi serta kebijakan insentif bagi industri energi terbarukan. Tanpa langkah konkret, target tersebut akan sulit tercapai.', 2, true),
  ('reading', 'hard', 'Menurut para pakar, apa yang penting untuk transisi energi?', '["menghentikan semua industri","mengimpor minyak lebih banyak","investasi teknologi penyimpanan energi dan insentif","menambah tambang batu bara"]'::jsonb, 'investasi teknologi penyimpanan energi dan insentif', '文中说 pentingnya investasi dalam teknologi penyimpanan energi serta kebijakan insentif = 投资储能技术和激励政策的重要性', 'Transisi Energi di Indonesia', 'Indonesia berkomitmen untuk mencapai target nol emisi karbon pada tahun 2060. Pemerintah telah merancang peta jalan transisi energi yang mencakup pengembangan energi surya, angin, dan panas bumi. Namun, tantangan utamanya adalah ketergantungan yang masih tinggi pada batu bara sebagai sumber listrik utama. Para pakar menekankan pentingnya investasi dalam teknologi penyimpanan energi serta kebijakan insentif bagi industri energi terbarukan. Tanpa langkah konkret, target tersebut akan sulit tercapai.', 3, true),
  ('reading', 'hard', 'Energi terbarukan apa saja yang disebutkan dalam teks?', '["nuklir, gas, dan air","biomassa, air, dan gas","diesel, surya, dan air","surya, angin, dan panas bumi"]'::jsonb, 'surya, angin, dan panas bumi', '文中明确提到 energi surya（太阳能）、angin（风能）、panas bumi（地热能）', 'Transisi Energi di Indonesia', 'Indonesia berkomitmen untuk mencapai target nol emisi karbon pada tahun 2060. Pemerintah telah merancang peta jalan transisi energi yang mencakup pengembangan energi surya, angin, dan panas bumi. Namun, tantangan utamanya adalah ketergantungan yang masih tinggi pada batu bara sebagai sumber listrik utama. Para pakar menekankan pentingnya investasi dalam teknologi penyimpanan energi serta kebijakan insentif bagi industri energi terbarukan. Tanpa langkah konkret, target tersebut akan sulit tercapai.', 4, true),

-- ============================================================
-- READING · hard · 篇章 2：Digitalisasi Pendidikan（教育数字化）
-- ============================================================
  ('reading', 'hard', 'Apa yang mempercepat digitalisasi pendidikan menurut teks?', '["pandemi COVID-19","kebijakan pemerintah","persaingan antarnegara","kenaikan harga buku"]'::jsonb, 'pandemi COVID-19', '文中说 pandemi COVID-19 telah mempercepat proses digitalisasi pendidikan', 'Digitalisasi Pendidikan', 'Pandemi COVID-19 telah mempercepat proses digitalisasi pendidikan di Indonesia. Jutaan siswa beralih ke pembelajaran daring menggunakan berbagai platform digital. Meskipun demikian, kesenjangan akses internet antara daerah perkotaan dan pedesaan masih menjadi hambatan besar. Kementerian Pendidikan meluncurkan program penyediaan perangkat dan jaringan internet gratis untuk daerah terpencil. Evaluasi awal menunjukkan bahwa siswa di daerah yang mendapat bantuan tersebut mengalami peningkatan nilai rata-rata sebesar 15%.', 1, true),
  ('reading', 'hard', 'Apa hambatan utama digitalisasi pendidikan?', '["kurangnya guru","kesenjangan akses internet kota dan desa","kurangnya konten digital","harga perangkat yang mahal"]'::jsonb, 'kesenjangan akses internet kota dan desa', '文中说 kesenjangan akses internet antara daerah perkotaan dan pedesaan = 城乡互联网接入差距', 'Digitalisasi Pendidikan', 'Pandemi COVID-19 telah mempercepat proses digitalisasi pendidikan di Indonesia. Jutaan siswa beralih ke pembelajaran daring menggunakan berbagai platform digital. Meskipun demikian, kesenjangan akses internet antara daerah perkotaan dan pedesaan masih menjadi hambatan besar. Kementerian Pendidikan meluncurkan program penyediaan perangkat dan jaringan internet gratis untuk daerah terpencil. Evaluasi awal menunjukkan bahwa siswa di daerah yang mendapat bantuan tersebut mengalami peningkatan nilai rata-rata sebesar 15%.', 2, true),
  ('reading', 'hard', 'Apa yang diluncurkan Kementerian Pendidikan?', '["beasiswa luar negeri","pelatihan guru di kota besar","program perangkat dan internet gratis untuk daerah terpencil","ujian daring nasional"]'::jsonb, 'program perangkat dan internet gratis untuk daerah terpencil', '文中说 meluncurkan program penyediaan perangkat dan jaringan internet gratis untuk daerah terpencil', 'Digitalisasi Pendidikan', 'Pandemi COVID-19 telah mempercepat proses digitalisasi pendidikan di Indonesia. Jutaan siswa beralih ke pembelajaran daring menggunakan berbagai platform digital. Meskipun demikian, kesenjangan akses internet antara daerah perkotaan dan pedesaan masih menjadi hambatan besar. Kementerian Pendidikan meluncurkan program penyediaan perangkat dan jaringan internet gratis untuk daerah terpencil. Evaluasi awal menunjukkan bahwa siswa di daerah yang mendapat bantuan tersebut mengalami peningkatan nilai rata-rata sebesar 15%.', 3, true),
  ('reading', 'hard', 'Berapa persen peningkatan nilai rata-rata siswa yang mendapat bantuan?', '["10%","20%","5%","15%"]'::jsonb, '15%', '文中说 peningkatan nilai rata-rata sebesar 15%', 'Digitalisasi Pendidikan', 'Pandemi COVID-19 telah mempercepat proses digitalisasi pendidikan di Indonesia. Jutaan siswa beralih ke pembelajaran daring menggunakan berbagai platform digital. Meskipun demikian, kesenjangan akses internet antara daerah perkotaan dan pedesaan masih menjadi hambatan besar. Kementerian Pendidikan meluncurkan program penyediaan perangkat dan jaringan internet gratis untuk daerah terpencil. Evaluasi awal menunjukkan bahwa siswa di daerah yang mendapat bantuan tersebut mengalami peningkatan nilai rata-rata sebesar 15%.', 4, true)
;
