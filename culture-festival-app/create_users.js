// create_users.js
// ユーザーを一括登録するためのスクリプトです。
// 実行後、このファイルはセキュリティのため削除してください。

import { createClient } from '@supabase/supabase-js';

// 1. SupabaseのURLと、先ほど取得した「service_role」キーを直接貼り付けます
const supabaseUrl = 'https://pgndkndqmfvhwiegmnfi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnbmRrbmRxbWZ2aHdpZWdtbmZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTU2NjQzNywiZXhwIjoyMTA3MTQyNDM3fQ.eITUWNciez8lvRUZsCPPLbxOzUNmYIs-E5zI9Auzgf4';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 2. 作成したいスタッフのアカウントリストを人数分記述します
// （文化祭用の架空のメールアドレスで問題ありません）
const usersToCreate = [
 { email: 'x23u001@mitsuhashi.ac.jp', password: 'x23u001' },
  { email: 'x23u002@mitsuhashi.ac.jp', password: 'x23u002' },
  { email: 'x23u003@mitsuhashi.ac.jp', password: 'x23u003' },
  { email: 'x23u004@mitsuhashi.ac.jp', password: 'x23u004' },
  { email: 'x23u005@mitsuhashi.ac.jp', password: 'x23u005' },
  { email: 'x23u006@mitsuhashi.ac.jp', password: 'x23u006' },
  { email: 'x23u007@mitsuhashi.ac.jp', password: 'x23u007' },
  { email: 'x23u008@mitsuhashi.ac.jp', password: 'x23u008' },
  { email: 'x23u009@mitsuhashi.ac.jp', password: 'x23u009' },
  { email: 'x23u010@mitsuhashi.ac.jp', password: 'x23u010' },
  { email: 'x23u011@mitsuhashi.ac.jp', password: 'x23u011' },
  { email: 'x23u012@mitsuhashi.ac.jp', password: 'x23u012' },
  { email: 'x23u013@mitsuhashi.ac.jp', password: 'x23u013' },
  { email: 'x23u014@mitsuhashi.ac.jp', password: 'x23u014' },
  { email: 'x23u015@mitsuhashi.ac.jp', password: 'x23u015' },
  { email: 'x23u016@mitsuhashi.ac.jp', password: 'x23u016' },
  { email: 'x23u017@mitsuhashi.ac.jp', password: 'x23u017' },
  { email: 'x23u018@mitsuhashi.ac.jp', password: 'x23u018' },
  { email: 'x23u019@mitsuhashi.ac.jp', password: 'x23u019' },
  { email: 'x23u020@mitsuhashi.ac.jp', password: 'x23u020' },
  { email: 'x23u021@mitsuhashi.ac.jp', password: 'u20040528' },
  { email: 'x23u022@mitsuhashi.ac.jp', password: 'x23u022' },
  { email: 'x23u023@mitsuhashi.ac.jp', password: 'x23u023' },
  { email: 'x23u024@mitsuhashi.ac.jp', password: 'x23u024' },
  { email: 'x23u025@mitsuhashi.ac.jp', password: 'x23u025' },
  { email: 'x23u026@mitsuhashi.ac.jp', password: 'x23u026' },
  { email: 'x23u027@mitsuhashi.ac.jp', password: 'x23u027' },
  { email: 'x23u028@mitsuhashi.ac.jp', password: 'x23u028' },
  { email: 'x23u029@mitsuhashi.ac.jp', password: 'x23u029' },
  { email: 'x23u030@mitsuhashi.ac.jp', password: 'x23u030' },
  { email: 'x23u031@mitsuhashi.ac.jp', password: 'x23u031' },
  { email: 'x23u032@mitsuhashi.ac.jp', password: 'x23u032' },
  { email: 'x23u033@mitsuhashi.ac.jp', password: 'x23u033' },
  { email: 'x23u034@mitsuhashi.ac.jp', password: 'x23u034' },
  { email: 'x23u035@mitsuhashi.ac.jp', password: 'x23u035' },
  { email: 'x23u036@mitsuhashi.ac.jp', password: 'x23u036' },
  { email: 'x23u037@mitsuhashi.ac.jp', password: 'x23u037' },
  { email: 'x23u038@mitsuhashi.ac.jp', password: 'x23u038' },
  { email: 'x23u039@mitsuhashi.ac.jp', password: 'x23u039' },
  { email: 'x23u040@mitsuhashi.ac.jp', password: 'x23u040' },
  { email: 'x23u041@mitsuhashi.ac.jp', password: 'x23u041' },
  { email: 'x23u042@mitsuhashi.ac.jp', password: 'x23u042' },
  { email: 'x23u043@mitsuhashi.ac.jp', password: 'x23u043' },
  { email: 'x23u044@mitsuhashi.ac.jp', password: 'x23u044' },
  { email: 'x23u045@mitsuhashi.ac.jp', password: 'x23u045' },
  { email: 'x23u046@mitsuhashi.ac.jp', password: 'x23u046' },
  { email: 'x23u047@mitsuhashi.ac.jp', password: 'x23u047' },
  { email: 'x23u048@mitsuhashi.ac.jp', password: 'x23u048' }
];

// 3. 順番にアカウントを作成する処理
async function bulkCreate() {
  for (const user of usersToCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true // 自動でメール認証済みにする
    });

    if (error) {
      console.error(`失敗 (${user.email}):`, error.message);
    } else {
      console.log(`成功: ${user.email} を作成しました`);
    }
  }
}

// 処理の実行
bulkCreate();