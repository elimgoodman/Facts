class StdOut(object):
    out = ""

    @classmethod
    def writeLn(self, txt):
        self.out += str(txt) + "\n"

    @classmethod
    def flush(self):
        out = self.out
        self.out = ""
        return out
